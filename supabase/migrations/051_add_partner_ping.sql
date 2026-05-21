-- Migration 051: Partner ping timestamp
-- Tracks when the owner last sent a "nudge" email to their partner
-- during the "waiting for partner to reveal" state.
-- Rate-limited to once per 24 hours server-side.

alter table public.profiles
  add column if not exists partner_ping_sent_at timestamptz default null;
