-- ============================================================
-- Migration 021: Deletion-holds cleanup helper
-- ============================================================
-- Companion to migration 020. Deletes hold rows whose cooldown has
-- already elapsed so the table doesn't grow unbounded. Read-time
-- checks already ignore expired holds, so this is purely housekeeping.
-- Invoked from the daily notify-dates cron alongside cleanup_rate_limits().

create or replace function public.cleanup_deletion_holds()
returns int
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_deleted int;
begin
  delete from public.deletion_holds
    where expires_at < now();
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

revoke execute on function public.cleanup_deletion_holds() from public;
grant  execute on function public.cleanup_deletion_holds() to service_role;
