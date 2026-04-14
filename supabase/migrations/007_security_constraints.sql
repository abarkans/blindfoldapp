-- ============================================================
-- Migration 007: Security Constraints
-- ============================================================

-- L9: Add a CHECK constraint on the cadence column so invalid values are
--     rejected at the database level regardless of the calling client.
--     Prevents direct API / SQL injection from setting arbitrary cadence values.
--     Wrapped in a DO block so re-running the migration is safe.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_cadence_check'
  ) then
    alter table public.profiles
      add constraint profiles_cadence_check
      check (cadence in ('weekly', 'biweekly', 'monthly', 'spontaneous'));
  end if;
end $$;


-- L3: Harden complete_date_atomic() with a caller identity check.
--     The function is SECURITY DEFINER (runs as the DB owner), so without this
--     guard a direct RPC call with a spoofed p_user_id would succeed even if
--     RLS blocks direct table access.  auth.uid() is always set by Supabase for
--     authenticated callers and cannot be forged.
create or replace function public.complete_date_atomic(p_user_id uuid, p_xp_gain integer)
returns jsonb language plpgsql security definer as $$
declare
  v_idea_id   uuid;
  v_new_xp    integer;
  v_new_count integer;
begin
  -- Defense-in-depth: verify the calling session owns the target row.
  if (select auth.uid()) is distinct from p_user_id then
    raise exception 'Unauthorized';
  end if;

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
