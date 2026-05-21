-- ============================================================
-- Migration 052: Fix recursive couple_members SELECT policy
-- ============================================================
-- The "Members can view couple members" policy from migration 027
-- contains a self-referential subquery:
--
--   exists (select 1 from public.couple_members cm
--           where cm.profile_id = couple_members.profile_id
--             and cm.user_id = auth.uid())
--
-- PostgreSQL detects this as infinite recursion and raises an error
-- whenever an authenticated client touches any table whose RLS policy
-- queries couple_members (including the profiles SELECT policy).
-- This caused the handle_new_user trigger to silently fail on signup
-- (no profile row created), breaking onboarding for new users.
--
-- Fix: replace the recursive policy with a simple non-recursive check.
-- All app reads of couple_members that need cross-member visibility
-- (getCoupleAccess, getPartnerInviteStatus) already use the admin
-- client (service_role) which bypasses RLS entirely — so the
-- simplified policy is sufficient and correct.

DROP POLICY IF EXISTS "Members can view couple members" ON public.couple_members;

CREATE POLICY "Members can view couple members"
  ON public.couple_members FOR SELECT
  USING (user_id = (SELECT auth.uid()));
