-- 045: Allow outside date completion when each partner has decided (checked in
-- OR uploaded a photo) and at least one real photo exists.
--
-- Previous guard required every physically-checked-in member to have a photo
-- row, blocking completion when Partner A uploaded but Partner B only checked
-- in without a photo.
--
-- New outside-date rules:
--   1. At least one real (non-skipped) physical check-in — unchanged.
--   2. At least one real (non-skipped) photo.
--   3. Every member has "decided": checkin_*_at IS NOT NULL  OR  has any photo row.
--      Skipped check-ins count (checkin_*_at is set by skipCheckIn()).
--
-- Home-date rules unchanged.

create or replace function public.complete_date_atomic(p_user_id uuid, p_xp_gain integer)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_idea_id          uuid;
  v_location_type    text;
  v_plan             text;
  v_new_xp           integer;
  v_new_count        integer;
  v_gated            boolean;
  v_caller           uuid;
  v_photo_count      bigint;
  v_member_count     bigint;
  v_undecided_count  bigint;
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

  if v_location_type is distinct from 'home' then
    -- Outside dates: at least one partner must have physically checked in (not skipped).
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

    -- At least one real (non-skipped) photo must exist.
    select count(*) into v_photo_count
    from public.date_photos
    where date_idea_id = v_idea_id
      and profile_id   = p_user_id
      and skipped      = false;

    if v_photo_count < 1 then
      raise exception 'At least one photo required to complete the date';
    end if;

    -- Every member must have decided: checked in (any kind) OR has a photo row.
    select count(*) into v_undecided_count
    from public.couple_members cm
    join public.profiles pr on pr.id = p_user_id
    where cm.profile_id = p_user_id
      -- member has no checkin timestamp of any kind
      and (
        case
          when cm.role = 'owner'   then pr.checkin_owner_at   is null
          when cm.role = 'partner' then pr.checkin_partner_at is null
          else true
        end
      )
      -- and no photo row for this date
      and not exists (
        select 1 from public.date_photos dp
        where dp.date_idea_id     = v_idea_id
          and dp.profile_id       = p_user_id
          and dp.uploader_user_id = cm.user_id
      );

    if v_undecided_count > 0 then
      raise exception 'Waiting for partner to check in or add a photo';
    end if;

  else
    -- Home dates: all members must have a photo row, at least one real.
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
