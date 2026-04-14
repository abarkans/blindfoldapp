-- Migration 009: Fix cadence default to satisfy the CHECK constraint added in 007.
-- The handle_new_user() trigger inserts only (id), relying on column defaults.
-- The previous default '' violates profiles_cadence_check; 'weekly' is the safe fallback.
ALTER TABLE public.profiles
  ALTER COLUMN cadence SET DEFAULT 'weekly';
