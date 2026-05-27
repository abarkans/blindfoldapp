-- ============================================================
-- Migration 057: Fix complete_date_atomic + lock date_ideas/date_photos to service_role
-- ============================================================
--
-- SECURITY FIXES:
--
-- 1. complete_date_atomic — rewrite with three hard guards:
--    a) Remove caller-supplied p_xp_gain parameter. XP is now server-determined
--       (100 base / 200 Plus). Prevents authenticated clients from calling
--       rpc("complete_date_atomic", { p_xp_gain: 1_000_000 }).
--    b) Restore non-skipped check-in guard from migration 046 (regression in 047):
--       requires at least one partner to have physically checked in (not skipped).
--       "Both users skip" path was exploitable — skipped timestamps still satisfied
--       the 047 "both timestamps non-null" check.
--    c) Photo count now only counts rows belonging to members who physically
--       checked in (not skipped). 047 counted all photo rows regardless of skip
--       status, so fake/skipped rows satisfied the guard.
--    Function is now service_role only. completeDate() server action switches
--    to admin client (see app/actions/complete-date.ts).
--
-- 2. Drop old complete_date_atomic(uuid, integer) signature so no client can
--    call the XP-parameter version even if types are stale.
--
-- 3. date_ideas INSERT/UPDATE — revoke from authenticated entirely.
--    All server actions that write date_ideas use admin client (service_role).
--    complete_date_atomic is SECURITY DEFINER (runs as postgres) and bypasses RLS.
--    Clients only need SELECT (retained from migration 054).
--    Without this, clients could INSERT status='revealed' directly to bypass the
--    server reveal workflow, then combine with #1 to complete with arbitrary XP.
--
-- 4. date_photos INSERT — revoke from authenticated entirely.
--    savePhoto() and skipPhoto() both use admin client. Presign route only
--    generates URLs; it does not insert rows. Removing the policy closes the
--    fake-photo-row injection path that could satisfy the photo-count guard in
--    complete_date_atomic even without a real upload.
--
-- NOT fixed here (tracked separately):
--   - Stripe webhook idempotency gap on hard crash (issue #5)
--   - R2 presign missing ContentLengthRange (issue #9)
--   - Presign missing status='revealed' check for home dates (issue #10)
--   - GPS check-in coordinate spoofing (architectural limitation)
-- ============================================================

-- ── 1. Rewrite complete_date_atomic ─────────────────────────────────────────

create or replace function public.complete_date_atomic(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_idea_id        uuid;
  v_location_type  text;
  v_plan           text;
  v_new_xp         integer;
  v_new_count      integer;
  v_xp_award       integer;
  v_photo_count    bigint;
  v_member_count   bigint;
begin
  -- Lock the revealed date row to prevent concurrent completions.
  -- Runs as postgres (SECURITY DEFINER) → bypasses RLS on date_ideas.
  select id, location_type into v_idea_id, v_location_type
  from public.date_ideas
  where user_id = p_user_id
    and status  = 'revealed'
  order by revealed_at desc
  limit 1
  for update;

  if v_idea_id is null then
    raise exception 'No active revealed date found';
  end if;

  if v_location_type is distinct from 'home' then
    -- ── Outside dates ───────────────────────────────────────────────────────

    -- Guard A: at least one partner must have physically checked in (not skipped).
    -- Blocks the "both users skip" exploit path: skipped timestamps set
    -- checkin_*_at to non-null, which the 047 version accepted as a real check-in.
    if not exists (
      select 1 from public.profiles
      where id = p_user_id
        and (
          (checkin_owner_at   is not null and not coalesce(checkin_owner_skipped,   false)) or
          (checkin_partner_at is not null and not coalesce(checkin_partner_skipped, false))
        )
    ) then
      raise exception 'At least one partner must physically check in before completion';
    end if;

    -- Guard B: every member who physically checked in needs a photo row.
    -- Count only non-skipped members (those who physically attended).
    select count(*) into v_member_count
    from public.couple_members cm
    join public.profiles pr on pr.id = p_user_id
    where cm.profile_id = p_user_id
      and case
        when cm.role = 'owner'
          then pr.checkin_owner_at   is not null and not coalesce(pr.checkin_owner_skipped,   false)
        when cm.role = 'partner'
          then pr.checkin_partner_at is not null and not coalesce(pr.checkin_partner_skipped, false)
        else false
      end;

    -- Count photo rows that belong to non-skipped members.
    -- 047 counted all rows regardless of who uploaded or their check-in status,
    -- allowing fake rows from skipped members to satisfy this guard.
    select count(*) into v_photo_count
    from public.date_photos dp
    join public.couple_members cm
      on  cm.profile_id = p_user_id
      and cm.user_id    = dp.uploader_user_id
    join public.profiles pr on pr.id = p_user_id
    where dp.date_idea_id = v_idea_id
      and dp.profile_id   = p_user_id
      and case
        when cm.role = 'owner'
          then pr.checkin_owner_at   is not null and not coalesce(pr.checkin_owner_skipped,   false)
        when cm.role = 'partner'
          then pr.checkin_partner_at is not null and not coalesce(pr.checkin_partner_skipped, false)
        else false
      end;

    if v_photo_count < v_member_count then
      raise exception 'All members who checked in must submit or skip photo before completion';
    end if;

  else
    -- ── Home dates ──────────────────────────────────────────────────────────

    -- All members must have a photo row (upload or photo-skip).
    select count(*) into v_member_count
    from public.couple_members
    where profile_id = p_user_id;

    select count(*) into v_photo_count
    from public.date_photos
    where date_idea_id = v_idea_id
      and profile_id   = p_user_id;

    if v_photo_count < v_member_count then
      raise exception 'Waiting for all partners to decide on photo';
    end if;

    -- At least one real (non-skipped) photo required.
    select count(*) into v_photo_count
    from public.date_photos
    where date_idea_id = v_idea_id
      and profile_id   = p_user_id
      and skipped      = false;

    if v_photo_count < 1 then
      raise exception 'At least one partner must capture a photo to complete a home date';
    end if;
  end if;

  -- Mark date completed. Runs as postgres → bypasses RLS.
  update public.date_ideas
    set status = 'completed'
  where id = v_idea_id;

  -- Lock profile row before reading plan_type to avoid concurrent plan changes
  -- affecting the XP multiplier between the read and the update below.
  select plan_type into v_plan
  from public.profiles
  where id = p_user_id
  for update;

  -- XP is server-determined. Caller cannot influence the award amount.
  -- Base: 100 XP. Plus subscribers: 200 XP (2×).
  v_xp_award := 100 * case when coalesce(v_plan, 'free') = 'subscription' then 2 else 1 end;

  update public.profiles
    set total_xp              = total_xp + v_xp_award,
        dates_completed_count = dates_completed_count + 1
  where id = p_user_id
  returning total_xp, dates_completed_count
    into v_new_xp, v_new_count;

  return jsonb_build_object(
    'total_xp',              v_new_xp,
    'dates_completed_count', v_new_count,
    'xp_awarded',            v_xp_award,
    'completed_idea_id',     v_idea_id
  );
end;
$$;

-- Service_role only: completeDate() server action switches to admin client.
-- Prevents browser clients from calling this directly with arbitrary arguments.
revoke execute on function public.complete_date_atomic(uuid) from public;
revoke execute on function public.complete_date_atomic(uuid) from anon;
revoke execute on function public.complete_date_atomic(uuid) from authenticated;
grant  execute on function public.complete_date_atomic(uuid) to service_role;

-- ── 2. Drop old XP-parameter signature ──────────────────────────────────────

-- Removes the (uuid, integer) overload so clients cannot call the old version
-- even if their local Supabase type definitions are stale.
drop function if exists public.complete_date_atomic(uuid, integer);

-- ── 3. Lock date_ideas writes to service_role ────────────────────────────────

-- All server actions that mutate date_ideas use createAdminClient() (service_role).
-- complete_date_atomic is SECURITY DEFINER (runs as postgres) — unaffected by RLS.
-- Clients retain SELECT to read the date card in RSC / client components.

drop policy if exists "Users can insert own date ideas"              on public.date_ideas;
drop policy if exists "owner or couple member can update date ideas" on public.date_ideas;

-- No INSERT or UPDATE policies remain for authenticated/anon.
-- service_role (admin client) bypasses RLS entirely.

-- ── 4. Lock date_photos writes to service_role ───────────────────────────────

-- savePhoto() and skipPhoto() both use createAdminClient(). The presign route
-- only issues signed PUT URLs; it never inserts date_photos rows itself.
-- Removing the INSERT policy closes the fake-photo-row injection path.

drop policy if exists "users can insert own date photos" on public.date_photos;

-- No INSERT policy remains for authenticated/anon.
-- service_role (admin client) bypasses RLS entirely.
