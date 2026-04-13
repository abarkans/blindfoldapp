-- ============================================================
-- Migration 006: Security Hardening
-- ============================================================

-- 1. Fix deprecated auth.role() in milestones RLS policy
--    auth.role() is unreliable in some Supabase RLS contexts;
--    (select auth.uid()) IS NOT NULL is the correct authenticated check.
drop policy if exists "milestones are viewable by authenticated users" on public.milestones;

create policy "milestones are viewable by authenticated users"
  on public.milestones for select
  using ((select auth.uid()) is not null);


-- 2. Protect revealed_at from client-side rollback
--    Without this, an attacker with a valid session could call
--    supabase.from("profiles").update({ revealed_at: null })
--    to bypass the cadence cooldown and trigger unlimited AI generation.
create or replace function public.protect_revealed_at()
returns trigger language plpgsql security definer as $$
begin
  -- Only block rollbacks: setting to null or an earlier timestamp
  if old.revealed_at is not null
     and (new.revealed_at is null or new.revealed_at < old.revealed_at)
  then
    new.revealed_at = old.revealed_at;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_revealed_at_trigger on public.profiles;

create trigger protect_revealed_at_trigger
  before update of revealed_at on public.profiles
  for each row
  execute function public.protect_revealed_at();


-- 3. Atomic date completion to eliminate the race-condition double-XP window.
--    The previous app-level read-then-write allowed concurrent completeDate()
--    calls to both read the same total_xp and both earn XP from the same base.
--    This function holds a row lock on date_ideas, making the full operation
--    atomic. The existing award_milestone_badges() trigger fires automatically
--    on the profile update inside this function.
create or replace function public.complete_date_atomic(p_user_id uuid, p_xp_gain integer)
returns jsonb language plpgsql security definer as $$
declare
  v_idea_id        uuid;
  v_new_xp         integer;
  v_new_count      integer;
begin
  -- Lock and find the most recent revealed idea for this user
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

  -- Mark it completed
  update public.date_ideas
    set status = 'completed'
  where id = v_idea_id;

  -- Atomically increment XP and count (triggers award_milestone_badges)
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
