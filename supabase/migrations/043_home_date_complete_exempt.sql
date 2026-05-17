-- 043: Fix completion guards for home dates and partial-skip outside dates.
--
-- Home dates have no GPS check-in step — checkin_owner_at / checkin_partner_at
-- are never set for them.
--
-- Outside dates now support one partner skipping check-in. The previous guards
-- required BOTH partners to check in and ALL members to have photo rows — both
-- incorrect when one partner legitimately skips.
--
-- Changes:
--   1. Skip the checkin_at guard entirely for home dates.
--   2. Outside dates: require at least one partner physically present
--      (checkin_owner_at OR checkin_partner_at is non-null).
--   3. For home dates: require >= 1 real (non-skipped) photo.
--   4. For outside dates: require a photo row only from members who checked in
--      (exclude members whose checkin_*_skipped = true).

create or replace function public.complete_date_atomic(p_user_id uuid, p_xp_gain integer)
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
  v_gated          boolean;
  v_caller         uuid;
  v_photo_count    bigint;
  v_member_count   bigint;
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

  -- Dual check-in guard: outside dates only.
  -- Home dates have no GPS check-in step so checkin_owner_at/partner_at are never set.
  -- Outside dates: at least one partner must have physically checked in (not both skipped).
  if v_location_type is distinct from 'home' then
    if not exists (
      select 1 from public.profiles
      where id = p_user_id
        and (checkin_owner_at is not null or checkin_partner_at is not null)
    ) then
      raise exception 'Dual check-in required before completion';
    end if;
  end if;

  -- Photo prerequisite:
  --   Home dates  → all members must have a photo row, and at least 1 must be real.
  --   Outside dates → every member who physically checked in must have a photo row.
  if v_location_type = 'home' then
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
  else
    -- Count only members who physically checked in (didn't skip check-in).
    select count(*) into v_member_count
    from public.couple_members cm
    join public.profiles pr on pr.id = p_user_id
    where cm.profile_id = p_user_id
      and case
        when cm.role = 'owner'   then not coalesce(pr.checkin_owner_skipped,   false)
        when cm.role = 'partner' then not coalesce(pr.checkin_partner_skipped, false)
        else true
      end;

    -- Count photo rows whose uploader is among those who checked in.
    select count(*) into v_photo_count
    from public.date_photos dp
    join public.couple_members cm
      on  cm.profile_id = p_user_id
      and cm.user_id    = dp.uploader_user_id
    join public.profiles pr on pr.id = p_user_id
    where dp.date_idea_id = v_idea_id
      and dp.profile_id   = p_user_id
      and case
        when cm.role = 'owner'   then not coalesce(pr.checkin_owner_skipped,   false)
        when cm.role = 'partner' then not coalesce(pr.checkin_partner_skipped, false)
        else true
      end;

    if v_photo_count < v_member_count then
      raise exception 'All members must submit or skip photo before completion';
    end if;
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
