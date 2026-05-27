-- ============================================================
-- Migration 058: Two-phase Stripe webhook idempotency
-- ============================================================
--
-- PROBLEM (issue #5):
--   The current claim-before-process pattern has a hard-crash gap:
--     1. INSERT event.id into processed_stripe_events (claim)
--     2. Update profile ← hard crash here
--     3. DELETE claim on caught exceptions (never runs after crash)
--   Result: claim row is stuck. Stripe retries hit the unique constraint
--   and return 200 without reprocessing → billing state left wrong.
--
-- FIX: Two-phase status column.
--   INSERT with status='pending', UPDATE to status='completed' after success.
--   Stripe retries that see pending + age > 30s = crash remnant → re-claimable.
--   Stripe retries that see completed = truly done → skip safely.
--
-- Existing rows default to 'completed' — they were all fully processed
-- by the old webhook handler that returned 200 only after finishing.
-- ============================================================

alter table public.processed_stripe_events
  add column if not exists status text not null default 'completed'
  constraint processed_stripe_events_status_check
    check (status in ('pending', 'completed'));

comment on column public.processed_stripe_events.status is
  'pending = claimed but not yet committed; completed = fully processed. '
  'Rows stuck in pending for >30s are crash remnants and may be re-claimed by Stripe retries.';
