-- ============================================================
-- Migration 053: Revoke public EXECUTE on internal/trigger functions
-- ============================================================
-- Supabase security advisor flagged SECURITY DEFINER functions callable
-- by anon and authenticated via /rest/v1/rpc/. Most are trigger-only or
-- service_role-only; none should be invocable by unprivileged callers.
--
-- Functions fixed:
--   1. award_milestone_badges()         trigger-only
--   2. award_subscriber_badge()         trigger-only + add missing search_path
--   3. handle_new_user()                auth trigger-only
--   4. protect_revealed_at()            trigger-only
--   5. validate_user_signup()           auth hook-only
--   6. rls_auto_enable()                Supabase internal — revoke only
--   7. complete_date_atomic()           revoke anon; authenticated retained
--   8-14. service_role-only RPCs        re-stated idempotently (already revoked
--         in migrations 017/018/021/022/049 — re-state in case of remote-DB gap)
--
-- complete_date_atomic rationale:
--   completeDate() server action calls this via createClient() (authenticated
--   Supabase client, not admin). The function enforces auth.uid() ownership
--   internally (raises 'Unauthorized' for anon/wrong-user), so authenticated
--   access is safe and must be preserved. anon access is revoked.

-- ── 1. award_milestone_badges — trigger only ─────────────────────────────────
revoke execute on function public.award_milestone_badges() from public;
revoke execute on function public.award_milestone_badges() from anon;
revoke execute on function public.award_milestone_badges() from authenticated;

-- ── 2. award_subscriber_badge — trigger only + fix mutable search_path ───────
-- Migration 037 created this without SET search_path (linter 0011) and without
-- a REVOKE. Recreate with search_path pinned, then revoke.
create or replace function public.award_subscriber_badge()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_milestone_id uuid;
begin
  if new.plan_type = 'subscription' and (old.plan_type is distinct from 'subscription') then
    select id into v_milestone_id
    from public.milestones
    where name = 'Subscriber';
    if v_milestone_id is not null then
      insert into public.user_badges (user_id, milestone_id)
      values (new.id, v_milestone_id)
      on conflict (user_id, milestone_id) do nothing;
    end if;
  end if;
  return new;
end;
$$;

revoke execute on function public.award_subscriber_badge() from public;
revoke execute on function public.award_subscriber_badge() from anon;
revoke execute on function public.award_subscriber_badge() from authenticated;

-- ── 3. handle_new_user — auth trigger only ───────────────────────────────────
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.handle_new_user() from anon;
revoke execute on function public.handle_new_user() from authenticated;

-- ── 4. protect_revealed_at — trigger only ────────────────────────────────────
revoke execute on function public.protect_revealed_at() from public;
revoke execute on function public.protect_revealed_at() from anon;
revoke execute on function public.protect_revealed_at() from authenticated;

-- ── 5. validate_user_signup — auth hook only ─────────────────────────────────
revoke execute on function public.validate_user_signup() from public;
revoke execute on function public.validate_user_signup() from anon;
revoke execute on function public.validate_user_signup() from authenticated;

-- ── 6. rls_auto_enable — Supabase internal ───────────────────────────────────
-- Not defined in our migrations. Wrapped in DO block in case it doesn't exist
-- in all environments (local dev vs. hosted Supabase may differ).
do $$
begin
  revoke execute on function public.rls_auto_enable() from public;
  revoke execute on function public.rls_auto_enable() from anon;
  revoke execute on function public.rls_auto_enable() from authenticated;
exception
  when undefined_function then null;
end;
$$;

-- ── 7. complete_date_atomic — revoke anon, retain authenticated ──────────────
-- Server action uses createClient() (authenticated session), not admin client.
-- The function calls auth.uid() and raises 'Unauthorized' for anon/wrong-user,
-- so authenticated access is safe. Anon must not reach this endpoint.
revoke execute on function public.complete_date_atomic(uuid, integer) from public;
revoke execute on function public.complete_date_atomic(uuid, integer) from anon;
-- Explicit grant so intent is clear in the migration record:
grant  execute on function public.complete_date_atomic(uuid, integer) to authenticated;

-- ── 8–14. Service-role-only RPCs (idempotent re-statement) ──────────────────
-- Already revoked in migs 017/018/021/022/049. Re-stated here to close any
-- gap if the remote DB was provisioned from a partial migration history.

revoke execute on function public.check_rate_limit(text, int, int) from public;
revoke execute on function public.check_rate_limit(text, int, int) from anon;
revoke execute on function public.check_rate_limit(text, int, int) from authenticated;
grant  execute on function public.check_rate_limit(text, int, int) to service_role;

revoke execute on function public.cleanup_rate_limits() from public;
revoke execute on function public.cleanup_rate_limits() from anon;
revoke execute on function public.cleanup_rate_limits() from authenticated;
grant  execute on function public.cleanup_rate_limits() to service_role;

revoke execute on function public.backfill_completed_xp(uuid, integer) from public;
revoke execute on function public.backfill_completed_xp(uuid, integer) from anon;
revoke execute on function public.backfill_completed_xp(uuid, integer) from authenticated;
grant  execute on function public.backfill_completed_xp(uuid, integer) to service_role;

revoke execute on function public.cleanup_deletion_holds() from public;
revoke execute on function public.cleanup_deletion_holds() from anon;
revoke execute on function public.cleanup_deletion_holds() from authenticated;
grant  execute on function public.cleanup_deletion_holds() to service_role;

revoke execute on function public.cleanup_account_deletion_tokens() from public;
revoke execute on function public.cleanup_account_deletion_tokens() from anon;
revoke execute on function public.cleanup_account_deletion_tokens() from authenticated;
grant  execute on function public.cleanup_account_deletion_tokens() to service_role;

revoke execute on function public.cleanup_processed_stripe_events() from public;
revoke execute on function public.cleanup_processed_stripe_events() from anon;
revoke execute on function public.cleanup_processed_stripe_events() from authenticated;
grant  execute on function public.cleanup_processed_stripe_events() to service_role;

revoke execute on function public.cleanup_partner_invites() from public;
revoke execute on function public.cleanup_partner_invites() from anon;
revoke execute on function public.cleanup_partner_invites() from authenticated;
grant  execute on function public.cleanup_partner_invites() to service_role;
