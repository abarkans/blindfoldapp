-- ============================================================
-- Migration 068: Revoke Supabase default table privileges from anon/authenticated
-- ============================================================
-- A grant audit on 2026-08-28 found that EVERY table in public grants
-- DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE to BOTH
-- anon and authenticated -- including profiles, couple_members,
-- account_deletion_tokens, partner_invites and processed_stripe_events.
--
-- Source: Supabase's ALTER DEFAULT PRIVILEGES on the public schema, which grants
-- ALL on newly created tables to anon and authenticated. Migration 036 set out to
-- make grants explicit but only ever ADDED grants -- it never revoked the
-- defaults sitting underneath, so the explicit grants were a no-op in practice.
--
-- CURRENT EXPLOITABILITY: none via the Data API.
--   - DELETE/INSERT/UPDATE are denied by RLS: verified there is no DELETE policy
--     anywhere in the schema, couple_members has only a SELECT policy, and the
--     five service-role tables have no policies at all.
--   - TRUNCATE/TRIGGER/REFERENCES are not reachable through PostgREST, which
--     exposes only SELECT/INSERT/UPDATE/DELETE plus RPC.
--
-- WHY IT STILL MATTERS:
--   1. TRUNCATE IS NOT SUBJECT TO RLS. PostgreSQL applies row security to
--      DML only; "row security policies do not apply to TRUNCATE". It is the one
--      privilege here where RLS is not a backstop, so the entire safety margin
--      is "PostgREST has no TRUNCATE verb" rather than a permission check.
--   2. anon is the public key shipped in the JS bundle -- that is the internet,
--      not logged-in users.
--   3. It makes every future policy dangerous by default: adding one
--      `for delete` policy for a legitimate feature would simultaneously hand
--      anon DELETE on that table.
--   4. TRIGGER on a table is an escalation primitive if DDL ever becomes
--      reachable (attach an existing SECURITY DEFINER function to a table).
--
-- APPROACH: revoke everything from both roles, then re-grant exactly the set the
-- application needs. Fail-closed -- a table nobody explicitly grants is invisible
-- to the Data API, which is also the posture Supabase itself moves to when the
-- legacy default grants are removed on 2026-10-30.
--
-- VERIFIED BEFORE WRITING:
--   - anon needs nothing: the only browser-client table access in the codebase is
--     components/landing-v4/LandingV4Client.tsx:943 (profiles select), and it
--     returns early unless a session exists, so it runs as authenticated.
--   - All 105 profiles.update() call sites use createAdminClient() (service_role),
--     which is untouched here.
-- ============================================================


-- ── 1. Clear the slate ──────────────────────────────────────────────────────
-- service_role, postgres and supabase_admin are deliberately NOT touched: the
-- admin client, SECURITY DEFINER RPCs, cron and the Stripe webhook all depend
-- on them.

revoke all on all tables in schema public from anon;
revoke all on all tables in schema public from authenticated;

revoke all on all sequences in schema public from anon;
revoke all on all sequences in schema public from authenticated;


-- ── 2. Re-grant the minimal set the app actually uses ───────────────────────
--
-- anon: nothing. No public page reads a table without a session.

-- profiles — read/insert/update own or couple's row. Column-level protection is
-- the lockdown_protected_columns() trigger (migrations 015→067); row-level is the
-- "owner or couple member can …" policies from migration 054.
grant select, insert, update on public.profiles to authenticated;

-- date_ideas — SELECT only. Migration 057 dropped every write policy; all writes
-- go through service_role or complete_date_atomic (SECURITY DEFINER).
grant select on public.date_ideas to authenticated;

-- date_photos — SELECT only. Migration 057 dropped the INSERT policy; savePhoto()
-- and skipPhoto() both use the admin client.
grant select on public.date_photos to authenticated;

-- milestones — read-only reference data.
grant select on public.milestones to authenticated;

-- user_badges — awarded by SECURITY DEFINER trigger; clients only read.
grant select on public.user_badges to authenticated;

-- couple_members — read only. Also required for the EXISTS subqueries inside the
-- profiles/date_ideas/user_badges RLS policies, which are evaluated as the
-- calling role. Inserts happen via handle_new_user() and the admin client.
grant select on public.couple_members to authenticated;

-- app_feedback — insert only, no read policy (reviewed in the dashboard).
grant insert on public.app_feedback to authenticated;

-- Deliberately granted NOTHING (service_role only):
--   partner_invites, processed_stripe_events, rate_limits,
--   account_deletion_tokens, deletion_holds


-- ── 3. Stop the drift at the source ─────────────────────────────────────────
-- Without this, the next `create table` in public silently reinstates ALL for
-- both roles and this migration has to be written again. New tables now start
-- with no Data API access until explicitly granted -- fail-closed, and the same
-- posture Supabase adopts platform-wide on 2026-10-30.

alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke all on tables from authenticated;
alter default privileges in schema public revoke all on sequences from anon;
alter default privileges in schema public revoke all on sequences from authenticated;


-- ── Verification ────────────────────────────────────────────────────────────
-- Run after applying. Expect EXACTLY these seven rows and nothing else:
--
--   authenticated | app_feedback   | INSERT
--   authenticated | couple_members | SELECT
--   authenticated | date_ideas     | SELECT
--   authenticated | date_photos    | SELECT
--   authenticated | milestones     | SELECT
--   authenticated | profiles       | INSERT, SELECT, UPDATE
--   authenticated | user_badges    | SELECT
--
-- No anon rows at all.
--
--   select g.grantee, g.table_name,
--          string_agg(g.privilege_type, ', ' order by g.privilege_type) as privileges
--   from information_schema.role_table_grants g
--   join information_schema.tables t
--     on t.table_schema = g.table_schema and t.table_name = g.table_name
--   where g.table_schema = 'public'
--     and t.table_type = 'BASE TABLE'
--     and g.grantee in ('anon', 'authenticated')
--   group by g.grantee, g.table_name
--   order by g.grantee, g.table_name;
--
-- SMOKE TEST AFTER APPLYING (this migration can break reads if anything was
-- missed, so do not skip):
--   1. Log in, load /dashboard — reads profiles, date_ideas, user_badges,
--      couple_members, milestones.
--   2. Open /dashboard/progress — badge grid.
--   3. Load the landing page while logged in — LandingV4Client profiles select.
--   4. Submit app feedback — app_feedback insert.
-- A missing grant surfaces as an empty result or a 401/permission error, not a
-- crash, so check the data actually renders rather than just that the page loads.
