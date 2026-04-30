-- ============================================================
-- Migration 017: Gate XP & badges to subscription plan
-- ============================================================
-- Free-plan completions should still mark the date completed
-- (so the cadence/cooldown timer starts) but must not increment
-- total_xp or dates_completed_count. Skipping the count
-- increment also prevents the award_milestone_badges trigger
-- from firing, so free users earn no badges either.
--
-- The function continues to return total_xp + dates_completed_count
-- so the existing JS contract is unchanged. A new "gated" flag is
-- added so the server action can short-circuit the badge fetch.

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
begin
  if (select auth.uid()) is distinct from p_user_id then
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
    select total_xp, dates_completed_count
      into v_new_xp, v_new_count
    from public.profiles
    where id = p_user_id;
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
    'gated',                 v_gated
  );
end;
$$;
