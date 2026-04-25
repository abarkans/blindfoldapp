-- Migration 010: Add plan_type to profiles for cross-device plan sync.
-- Previously stored in localStorage only — now persisted in the DB.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plan_type TEXT NOT NULL DEFAULT 'free'
    CHECK (plan_type IN ('free', 'subscription'));
