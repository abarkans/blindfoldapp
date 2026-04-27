-- ============================================================
-- Migration 014: Stripe webhook idempotency
-- ============================================================
-- Stripe retries failed webhook deliveries (5xx, timeout). Without
-- a processed-event log, retries can double-process events that
-- partially succeeded. This table records every event.id we have
-- already handled so duplicate deliveries return 200 without re-running.

create table if not exists public.processed_stripe_events (
  event_id     text        primary key,
  processed_at timestamptz not null default now()
);

-- RLS on; no policies. Service role bypasses; no client should ever read this.
alter table public.processed_stripe_events enable row level security;
