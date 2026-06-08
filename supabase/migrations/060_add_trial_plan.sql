-- ============================================================
-- Migration 060: Add 'trial' plan type
-- Trial users get 1 free Plus-quality date. After completing it,
-- the server action in complete-date.ts downgrades them to free.
-- ============================================================

-- 1. Update plan_type CHECK constraint to allow 'trial'
alter table public.profiles
  drop constraint if exists profiles_plan_type_check;

alter table public.profiles
  add constraint profiles_plan_type_check
  check (plan_type in ('free', 'subscription', 'trial'));

-- 2. Update interests constraint so trial users can pick any category
--    (same as subscription). Constraint added in migration 030.
alter table public.profiles
  drop constraint if exists profiles_interests_by_plan;

alter table public.profiles
  add constraint profiles_interests_by_plan
  check (
    (
      plan_type in ('subscription', 'trial')
      and cardinality(interests) <= 12
    )
    or (
      plan_type not in ('subscription', 'trial')
      and cardinality(interests) <= 3
      and interests <@ array['food', 'nature', 'romance']::text[]
    )
  );

-- 3. Update complete_date_atomic so trial users earn 2× XP
--    (they are experiencing the full Plus showcase date).
--    Only line changed vs migration 057: the v_xp_award calculation.
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

    select count(*) into v_photo_count
    from public.date_photos
    where date_idea_id = v_idea_id
      and profile_id   = p_user_id
      and skipped      = false;

    if v_photo_count < 1 then
      raise exception 'At least one partner must capture a photo to complete a home date';
    end if;
  end if;

  update public.date_ideas
    set status = 'completed'
  where id = v_idea_id;

  select plan_type into v_plan
  from public.profiles
  where id = p_user_id
  for update;

  -- Trial users earn 2× XP (they are experiencing the Plus showcase).
  v_xp_award := 100 * case when coalesce(v_plan, 'free') in ('subscription', 'trial') then 2 else 1 end;

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

revoke execute on function public.complete_date_atomic(uuid) from public;
revoke execute on function public.complete_date_atomic(uuid) from anon;
