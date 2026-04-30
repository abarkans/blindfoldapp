-- ============================================================
-- Migration 018: Backfill XP when free user upgrades to Plus
-- ============================================================
-- Free-plan completions land in date_ideas with status='completed'
-- but skip the total_xp/dates_completed_count increment (gated in
-- complete_date_atomic, migration 017). When the user upgrades, we
-- want their existing completed dates to count: each past
-- 'completed' row grants XP and the badge trigger fires.
--
-- This RPC recomputes dates_completed_count and total_xp from the
-- authoritative date_ideas history. Setting (not incrementing) makes
-- it idempotent — running it twice produces the same state. Awards
-- happen via the existing on_dates_completed_update trigger.
--
-- Lockdown bypass: function is SECURITY DEFINER, owner = postgres,
-- so the lockdown_protected_columns trigger (migration 015) treats
-- the write as trusted.

create or replace function public.backfill_completed_xp(p_user_id uuid, p_xp_per_date integer default 100)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_count integer;
  v_xp    integer;
begin
  select count(*)::int into v_count
  from public.date_ideas
  where user_id = p_user_id
    and status  = 'completed';

  v_xp := v_count * p_xp_per_date;

  update public.profiles
    set total_xp              = v_xp,
        dates_completed_count = v_count
  where id = p_user_id;

  return jsonb_build_object(
    'total_xp',              v_xp,
    'dates_completed_count', v_count
  );
end;
$$;

revoke all on function public.backfill_completed_xp(uuid, integer) from public;
grant execute on function public.backfill_completed_xp(uuid, integer) to service_role;
