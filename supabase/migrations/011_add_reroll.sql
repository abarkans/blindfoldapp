-- Migration 011: Add re-roll tracking columns to profiles.
-- total_rerolls_used: lifetime counter — free plan is gated at 1 total.
-- current_date_rerolled: reset to false on each new reveal — subscription gated at 1 per date.
-- date_accepted_at: persists the user's "Accept" choice across reloads; reset on reveal/reroll.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS total_rerolls_used INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_date_rerolled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS date_accepted_at TIMESTAMPTZ NULL;
