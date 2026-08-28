-- ============================================================
-- Migration 069: Re-apply the non-recursive couple_members SELECT policy
-- ============================================================
-- Migration 052 fixed this exact bug. It is present in the repo but was NEVER
-- APPLIED to the production database: pg_policies on 2026-08-28 still shows
-- migration 027's self-referential version verbatim --
--
--   ((user_id = (SELECT auth.uid()))
--    OR EXISTS (SELECT 1 FROM couple_members cm
--               WHERE cm.profile_id = couple_members.profile_id
--                 AND cm.user_id = (SELECT auth.uid())))
--
-- The policy on couple_members queries couple_members, so PostgreSQL raises
--   "infinite recursion detected in policy for relation couple_members"
-- for any authenticated (non-service_role) client that touches couple_members OR
-- any table whose own policy references it -- which is profiles, date_ideas,
-- date_photos and user_badges. In practice: every RLS-protected read in the
-- schema.
--
-- WHY IT WENT UNNOTICED
--   Effectively every read in the app goes through createAdminClient()
--   (service_role), which bypasses RLS entirely. The only authenticated-client
--   read of profiles is components/landing-v4/LandingV4Client.tsx:943, and it
--   discards the error, degrading silently to "not onboarded". The bug surfaced
--   only when scripts/verify-lockdown.mjs exercised the path deliberately.
--
-- IMPACT: fails CLOSED. The query errors, so nothing is returned and no data is
-- exposed. This is a correctness bug, not a disclosure -- but it means RLS, the
-- second line of defence behind getCoupleAccess, has not actually been
-- functioning for profiles / date_ideas / date_photos / user_badges.
--
-- THE FIX (identical to 052): a flat, non-recursive predicate. Every cross-member
-- read that needs to see a partner's row (getCoupleAccess, getPartnerInviteStatus)
-- already uses the admin client and bypasses RLS, so restricting authenticated
-- clients to their own membership row is both sufficient and correct.
--
-- NOTE: the EXISTS subqueries in the profiles / date_ideas / date_photos /
-- user_badges policies read couple_members, so RLS on couple_members applies to
-- them too. With the flat predicate those subqueries see only the caller's own
-- membership rows -- which is exactly what each of them already filters on
-- (cm.user_id = auth.uid()), so their behaviour is unchanged.
-- ============================================================

drop policy if exists "Members can view couple members" on public.couple_members;

create policy "Members can view couple members"
  on public.couple_members for select
  using (user_id = (select auth.uid()));


-- ── Verification ────────────────────────────────────────────────────────────
--
-- 1. Confirm the policy is now flat. Expect exactly one row whose qual contains
--    no reference to couple_members:
--
--   select policyname, cmd, qual
--   from pg_policies
--   where schemaname = 'public' and tablename = 'couple_members';
--
-- 2. Confirm no remaining policy in the schema is self-referential (a policy on
--    table X whose qual selects from X). Expect zero rows:
--
--   select tablename, policyname, cmd
--   from pg_policies
--   where schemaname = 'public'
--     and qual like '%FROM ' || tablename || '%';
--
-- 3. End-to-end: re-run scripts/verify-lockdown.mjs. Before this migration it
--    fails at "could not read profile: infinite recursion detected". After, it
--    should read the profile and report BLOCKED on all twelve columns.


-- ── Schema drift, NOT addressed here ────────────────────────────────────────
--
-- The same pg_policies dump revealed public.preference_sessions -- a table with
-- three RLS policies that exists in the database but appears in NO migration and
-- is referenced by NO application code. It also holds no anon/authenticated
-- grants, so its policies can never be satisfied. It looks like an abandoned
-- dashboard experiment.
--
-- Deliberately left alone: dropping a table is not something a security migration
-- should do unilaterally. Decide and either (a) add a migration that creates it
-- properly if a feature needs it, or (b) drop it:
--
--     drop table if exists public.preference_sessions;
--
-- The broader lesson is the one that matters: migration 052 lived in the repo and
-- never reached the database, and a table reached the database without ever
-- living in the repo. The migration history is not currently the source of truth
-- for this schema. Reconciling it (supabase db diff, or a one-off audit of every
-- migration's end state against pg_policies / information_schema) is worth doing
-- before the next feature lands.
