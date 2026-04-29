-- ============================================================
-- Migration 019: Remove "spontaneous" cadence option
-- ============================================================
-- The "spontaneous" 3-day cadence is being removed from the product.
-- This migration:
--   1. Normalises any existing profiles with cadence='spontaneous'
--      to 'monthly' (default fallback for downgraded users elsewhere
--      in the codebase) before tightening the constraint.
--   2. Replaces profiles_cadence_check with a tighter constraint
--      that only permits 'weekly', 'biweekly', 'monthly'.
--
-- The application code (zod schemas, cadence-day maps, upgrade-page
-- VALID_CADENCES) is updated in the same change set so the DB and
-- code agree on the allowed enum values.

do $$
begin
  -- Normalise any rows that still hold the deprecated value.
  update public.profiles
    set cadence = 'monthly'
  where cadence = 'spontaneous';

  -- Drop the old constraint if it exists, then add the tightened one.
  if exists (
    select 1 from pg_constraint where conname = 'profiles_cadence_check'
  ) then
    alter table public.profiles drop constraint profiles_cadence_check;
  end if;

  alter table public.profiles
    add constraint profiles_cadence_check
    check (cadence in ('weekly', 'biweekly', 'monthly'));
end $$;
