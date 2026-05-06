-- ============================================================
-- Migration 026: Date Feedback (rating + comment)
-- ============================================================

-- 1. Add feedback columns to date_ideas
alter table public.date_ideas
  add column if not exists rating   smallint check (rating between 1 and 5),
  add column if not exists feedback text;

-- 2. Update complete_date_atomic to return the completed idea ID
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
    'gated',                 v_gated,
    'completed_idea_id',     v_idea_id
  );
end;
$$;

-- 3. Admin summary view (security_invoker ensures RLS applies for client queries;
--    Supabase dashboard with postgres/service_role sees all rows)
create or replace view public.date_feedback_summary
with (security_invoker = on) as
select
  di.id,
  di.rating,
  di.feedback,
  di.generated_at,
  di.revealed_at,
  (di.idea->>'display_name')      as venue_name,
  (di.idea->>'title')             as ai_title,
  (di.idea->>'place_id')          as place_id,
  (di.idea->>'formatted_address') as address,
  (di.idea->>'vibe')              as vibe,
  di.user_id,
  p.partner_names
from public.date_ideas di
join public.profiles p on di.user_id = p.id
where di.rating is not null;
