-- ============================================================
-- Migration 016: Pin search_path on all SECURITY DEFINER functions
-- ============================================================
-- A SECURITY DEFINER function executes with the privileges of its
-- owner. If the function references unqualified objects (e.g. now(),
-- gen_random_uuid, profiles) and any role earlier in search_path can
-- create a same-named object, the malicious object runs with owner
-- privileges. Setting an explicit search_path on the function defeats
-- this regardless of the caller's session search_path.
--
-- Functions covered:
--   public.handle_new_user
--   public.handle_updated_at
--   public.award_milestone_badges
--   public.protect_revealed_at
--   public.complete_date_atomic
--
-- Each function body is reproduced verbatim from its prior definition;
-- only the SET search_path = public, pg_temp clause is added.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.award_milestone_badges()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.user_badges (user_id, milestone_id)
  select new.id, m.id
  from public.milestones m
  where m.required_dates <= new.dates_completed_count
    and not exists (
      select 1 from public.user_badges ub
      where ub.user_id = new.id
        and ub.milestone_id = m.id
    )
  on conflict (user_id, milestone_id) do nothing;
  return new;
end;
$$;

create or replace function public.protect_revealed_at()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if old.revealed_at is not null
     and (new.revealed_at is null or new.revealed_at < old.revealed_at)
  then
    new.revealed_at = old.revealed_at;
  end if;
  return new;
end;
$$;

create or replace function public.complete_date_atomic(p_user_id uuid, p_xp_gain integer)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_idea_id   uuid;
  v_new_xp    integer;
  v_new_count integer;
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

  update public.profiles
    set total_xp              = total_xp + p_xp_gain,
        dates_completed_count = dates_completed_count + 1
  where id = p_user_id
  returning total_xp, dates_completed_count
    into v_new_xp, v_new_count;

  return jsonb_build_object(
    'total_xp',              v_new_xp,
    'dates_completed_count', v_new_count
  );
end;
$$;
