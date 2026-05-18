-- ============================================================
-- Migration 049: Cleanup functions for unbounded tables
-- ============================================================
-- processed_stripe_events and partner_invites have no cleanup.
-- Both functions are piggybacked on the daily notify-dates cron.

-- Stripe's webhook replay window is ~72 hours. Keeping 400 days is
-- very conservative and costs ~0 at current scale, but we prune to
-- prevent unbounded growth over years.
create or replace function public.cleanup_processed_stripe_events()
returns int
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_deleted int;
begin
  delete from public.processed_stripe_events
    where processed_at < now() - interval '400 days';
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

revoke execute on function public.cleanup_processed_stripe_events() from public;
grant  execute on function public.cleanup_processed_stripe_events() to service_role;

-- Prune partner_invites rows that are no longer actionable:
--   - Expired and never accepted, with a 7-day grace window.
--   - Revoked, with a 7-day grace window.
-- Accepted invites are kept as historical records.
create or replace function public.cleanup_partner_invites()
returns int
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_deleted int;
begin
  delete from public.partner_invites
    where (
      -- Expired and never accepted
      expires_at < now() - interval '7 days'
      and accepted_at is null
    ) or (
      -- Revoked
      revoked_at < now() - interval '7 days'
    );
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

revoke execute on function public.cleanup_partner_invites() from public;
grant  execute on function public.cleanup_partner_invites() to service_role;
