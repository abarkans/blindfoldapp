-- ============================================================
-- Migration 017: Postgres-based rate limiter
-- ============================================================
-- Replaces the Upstash dependency with a self-hosted limiter built on
-- Supabase's existing Postgres. Each rate-limited action calls
-- check_rate_limit(key, max, window_seconds), which atomically buckets
-- requests into fixed time windows and returns whether the call is
-- allowed plus a retry-after hint.
--
-- Trade-offs vs. Upstash:
--   * +10-20 ms per limited action (one Postgres roundtrip).
--   * Fixed-window (not sliding) — boundary bursts are possible at the
--     edge of each window. Acceptable given low pre-launch traffic.
--   * Cleanup of stale rows is handled by cleanup_rate_limits(), which
--     is invoked from the daily notify-dates cron.
--
-- Security:
--   * RLS enabled on the table with no policies — only service role
--     can read/write (used by the SECURITY DEFINER RPCs below).
--   * EXECUTE on the RPCs is revoked from PUBLIC and granted only to
--     service_role so an authenticated client cannot burn another
--     user's quota by calling check_rate_limit with their key.

create table if not exists public.rate_limits (
  key          text        primary key,
  window_start timestamptz not null,
  count        int         not null default 0
);

-- Used by cleanup_rate_limits()
create index if not exists rate_limits_window_start_idx
  on public.rate_limits (window_start);

alter table public.rate_limits enable row level security;

-- Atomic check-and-increment. Returns (allowed, retry_after_seconds).
-- A row is created on first hit for a given key; subsequent hits within
-- the same window increment the counter. When the window rolls over,
-- the count resets to 1 and window_start advances.
create or replace function public.check_rate_limit(
  p_key            text,
  p_max            int,
  p_window_seconds int
) returns table (allowed boolean, retry_after_seconds int)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_now          timestamptz := now();
  v_epoch        bigint      := extract(epoch from v_now)::bigint;
  v_window_epoch bigint      := v_epoch - (v_epoch % p_window_seconds);
  v_window_start timestamptz := to_timestamp(v_window_epoch);
  v_count        int;
begin
  insert into public.rate_limits (key, window_start, count)
    values (p_key, v_window_start, 1)
  on conflict (key) do update
    set count        = case
                         when public.rate_limits.window_start = excluded.window_start
                           then public.rate_limits.count + 1
                         else 1
                       end,
        window_start = excluded.window_start
  returning public.rate_limits.count into v_count;

  if v_count <= p_max then
    return query select true, 0;
  else
    return query select false, (v_window_epoch + p_window_seconds - v_epoch)::int;
  end if;
end;
$$;

-- Cleanup helper — invoked by the daily notify-dates cron.
-- Deletes rows whose window_start is older than 1 day so the table
-- doesn't grow unbounded as keys churn.
create or replace function public.cleanup_rate_limits()
returns int
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_deleted int;
begin
  delete from public.rate_limits
    where window_start < now() - interval '1 day';
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

revoke execute on function public.check_rate_limit(text, int, int) from public;
grant  execute on function public.check_rate_limit(text, int, int) to service_role;

revoke execute on function public.cleanup_rate_limits() from public;
grant  execute on function public.cleanup_rate_limits() to service_role;
