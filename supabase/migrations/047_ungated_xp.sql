-- ============================================================
-- Migration 047: Ungated XP — free users earn XP and badges
-- ============================================================
-- All users now earn XP and unlock milestone badges.
-- Plus (subscription) earns 2× XP on every date completion.
-- Check-in XP is handled in the server action (check-in.ts).
--
-- Backfill: existing free users already have correct
-- dates_completed_count (migration 040). Only total_xp is missing —
-- set it to dates_completed_count × 100 where still 0.

create or replace function public.complete_date_atomic(p_user_id uuid, p_xp_gain integer)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_idea_id      uuid;
  v_plan         text;
  v_xp_award     integer;
  v_new_xp       integer;
  v_new_count    integer;
  v_caller       uuid;
  v_photo_count  bigint;
  v_member_count bigint;
begin
  v_caller := (select auth.uid());

  -- Allow the owner themselves, or their accepted partner.
  if v_caller is distinct from p_user_id
     and not exists (
       select 1
       from   public.couple_members
       where  profile_id = p_user_id
         and  user_id    = v_caller
         and  role       = 'partner'
     )
  then
    raise exception 'Unauthorized';
  end if;

  select id into v_idea_id
  from public.date_ideas
  where user_id = p_user_id
    and status  = 'revealed'
  order by revealed_at desc
  limit 1
  for update;

  if v_idea_id is null then
    raise exception 'No active revealed date found';
  end if;

  -- Require dual check-in.
  if not exists (
    select 1 from public.profiles
    where id                 = p_user_id
      and checkin_owner_at   is not null
      and checkin_partner_at is not null
  ) then
    raise exception 'Dual check-in required before completion';
  end if;

  -- Require every couple member to have a date_photos row (upload or skip).
  select count(*) into v_member_count
  from public.couple_members
  where profile_id = p_user_id;

  select count(*) into v_photo_count
  from public.date_photos
  where date_idea_id = v_idea_id
    and profile_id   = p_user_id;

  if v_photo_count < v_member_count then
    raise exception 'All members must submit or skip photo before completion';
  end if;

  update public.date_ideas
    set status = 'completed'
  where id = v_idea_id;

  select plan_type into v_plan
  from public.profiles
  where id = p_user_id
  for update;

  -- Plus users earn 2× XP; free users earn base XP.
  v_xp_award := p_xp_gain * case when coalesce(v_plan, 'free') = 'subscription' then 2 else 1 end;

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

-- Backfill XP for free users who completed dates before this migration.
-- Their dates_completed_count is already correct (migration 040).
-- Only update where total_xp is still 0 to avoid overwriting any manual grants.
update public.profiles
  set total_xp = dates_completed_count * 100
where plan_type  = 'free'
  and total_xp   = 0
  and dates_completed_count > 0;
