-- ============================================================
-- Migration 036: Explicit table grants
-- ============================================================
-- Supabase removes default public-schema grants on Oct 30, 2026.
-- Tables without explicit GRANTs become inaccessible via the Data API.
-- This migration makes all existing grants permanent and explicit.

-- User-facing tables (RLS policies already restrict row access)
grant select, insert, update
  on public.profiles
  to authenticated;

grant select, insert, update
  on public.date_ideas
  to authenticated;

-- Read-only reference data
grant select
  on public.milestones
  to authenticated;

-- Badge insert is done by SECURITY DEFINER trigger; clients only read
grant select
  on public.user_badges
  to authenticated;

-- Couple member insert is done by SECURITY DEFINER trigger; clients only read
grant select
  on public.couple_members
  to authenticated;

-- Internal/server-only tables: RLS enabled with no policies (authenticated
-- can never see rows regardless), but service_role still needs table grants.
grant select, insert, update, delete
  on public.partner_invites
  to service_role;

grant select, insert, update, delete
  on public.processed_stripe_events
  to service_role;

grant select, insert, update, delete
  on public.rate_limits
  to service_role;

grant select, insert, update, delete
  on public.account_deletion_tokens
  to service_role;

grant select, insert, update, delete
  on public.deletion_holds
  to service_role;
