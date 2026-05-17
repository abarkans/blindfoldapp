-- 040: Enforce check-in and photo prerequisites inside complete_date_atomic.
-- A direct server-action call could previously bypass the UI gate and complete
-- a date without dual check-in or photos. Checks run inside the same transaction
-- as the FOR UPDATE lock to prevent TOCTOU races.

create or replace function public.complete_date_atomic(p_user_id uuid, p_xp_gain integer)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_idea_id      uuid;
  v_plan         text;
  v_new_xp       integer;
  v_new_count    integer;
  v_gated        boolean;
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

  -- Require dual check-in. Timestamps are reset to null on each new reveal
  -- (see reveal.ts), so a stale check-in from a prior date cannot satisfy this.
  if not exists (
    select 1 from public.profiles
    where id                 = p_user_id
      and checkin_owner_at   is not null
      and checkin_partner_at is not null
  ) then
    raise exception 'Dual check-in required before completion';
  end if;

  -- Require every couple member to have a date_photos row (upload or skip)
  -- for this specific date. Mirrors tryCompleteIfBothDone in photo.ts.
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

  v_gated := coalesce(v_plan, 'free') <> 'subscription';

  if v_gated then
    update public.profiles
      set dates_completed_count = dates_completed_count + 1
    where id = p_user_id
    returning total_xp, dates_completed_count
      into v_new_xp, v_new_count;
  else
    update public.profiles
      set total_xp              = total_xp + p_xp_gain,
          dates_completed_count = dates_completed_count + 1
    where id = p_user_id
    returning total_xp, dates_completed_count
      into v_new_xp, v_new_count;
  end if;

  return jsonb_build_object(
    'total_xp',              v_new_xp,
    'dates_completed_count', v_new_count,
    'gated',                 v_gated,
    'completed_idea_id',     v_idea_id
  );
end;
$$;
