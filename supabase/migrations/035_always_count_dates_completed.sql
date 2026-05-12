-- ============================================================
-- Migration 035: Always increment dates_completed_count
-- ============================================================
-- Migration 017 gated dates_completed_count behind plan_type,
-- so free users always saw 0 in Statistics. The counter should
-- track real dates completed regardless of plan — only XP and
-- badges are subscription-only.
--
-- Also fixes the ProgressUpsell hasHistory check: it was based
-- on total_xp / badges only, so free users who completed dates
-- never saw "Your progress is paused" state.

create or replace function public.complete_date_atomic(p_user_id uuid, p_xp_gain integer)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_idea_id   uuid;
  v_plan      text;
  v_new_xp    integer;
  v_new_count integer;
  v_gated     boolean;
  v_caller    uuid;
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

  update public.date_ideas
    set status = 'completed'
  where id = v_idea_id;

  select plan_type into v_plan
  from public.profiles
  where id = p_user_id
  for update;

  v_gated := coalesce(v_plan, 'free') <> 'subscription';

  if v_gated then
    -- Free plan: count the date but no XP.
    update public.profiles
      set dates_completed_count = dates_completed_count + 1
    where id = p_user_id
    returning total_xp, dates_completed_count
      into v_new_xp, v_new_count;
  else
    -- Plus plan: count the date and award XP.
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
