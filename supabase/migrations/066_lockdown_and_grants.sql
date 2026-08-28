-- ============================================================
-- Migration 066: Close lockdown drift + plan-gate radius + revoke stale grants
-- ============================================================
-- Covers three findings from the 2026-08-28 security review.
--
-- Threat model for all three: an authenticated user hitting PostgREST directly
-- with NEXT_PUBLIC_SUPABASE_ANON_KEY from devtools. profiles has UPDATE granted
-- to `authenticated` (mig 036) and the policy from mig 054 admits
-- `auth.uid() = id OR <any couple member>`, so anything the
-- lockdown_protected_columns() trigger does not explicitly revert is writable
-- from a browser console.
--
-- Every application write to profiles goes through createAdminClient()
-- (service_role) and is therefore unaffected by the trigger — verified across
-- all 105 profiles.update() call sites before writing this migration.
--
--   F1  preferred_radius: no CHECK constraint anywhere, and absent from the
--       lockdown list. A free user could set 50000 and obtain the Plus
--       "near & far venue search" radius permanently, which also inflates the
--       Google Places field-mask cost on every reveal and reroll.
--
--   F2  lockdown drift, fourth occurrence. Migration 055 was written to fix
--       exactly this ("partner_ping_sent_at: added in mig 051, never added to
--       lockdown") and is still the LAST definition of the trigger. Added
--       since, unprotected:
--         reminder_sent_at      (059) — cron's only "send reminder once" guard
--         reengagement_sent_at  (065) — cron's only "send re-engagement" guard
--         email_notifications   (050) — never protected
--       Nulling the two *_sent_at columns re-arms those emails to BOTH the
--       owner and the linked partner on the next 09:00 cron run, repeatable
--       daily. The guard IS the rate limit; there is no other one on that path.
--
--   F11 date_ideas retained `grant insert, update ... to authenticated` from
--       mig 036 after mig 057 dropped every write policy. Inert today (RLS with
--       no permissive policy denies), but a trap for whoever adds a policy next.
-- ============================================================


-- ── 1. Plan-gated preferred_radius (F1) ─────────────────────────────────────
--
-- WARNING: this constraint couples plan_type and preferred_radius. Any
-- statement setting plan_type to a non-Plus value must lower preferred_radius
-- in the SAME statement or it will fail. Audited downgrade paths:
--   app/actions/complete-date.ts:113        sets both  OK
--   app/api/stripe/webhook/route.ts         sets both via FREE_PLAN_RESET  OK
--   app/actions/reveal.ts:113               FIXED in the same commit as this
--                                           migration (previously set plan_type
--                                           and interests only)

alter table public.profiles
  drop constraint if exists profiles_radius_by_plan;

-- Clamp existing rows into range before the constraint is validated, so the
-- migration cannot fail on legacy data.
update public.profiles
  set preferred_radius = least(greatest(coalesce(preferred_radius, 10000), 1000), 50000)
  where plan_type in ('subscription', 'trial')
    and (preferred_radius is null or preferred_radius < 1000 or preferred_radius > 50000);

update public.profiles
  set preferred_radius = least(greatest(coalesce(preferred_radius, 10000), 1000), 15000)
  where plan_type not in ('subscription', 'trial')
    and (preferred_radius is null or preferred_radius < 1000 or preferred_radius > 15000);

alter table public.profiles
  add constraint profiles_radius_by_plan
  check (
    (plan_type in ('subscription', 'trial') and preferred_radius between 1000 and 50000)
    or
    (plan_type not in ('subscription', 'trial') and preferred_radius between 1000 and 15000)
  );


-- ── 2. Restore full lockdown coverage (F1 + F2) ─────────────────────────────
--
-- Trigger is SECURITY INVOKER by design: current_user must be the CALLING role
-- for the trusted-context check to mean anything. Do not add SECURITY DEFINER.

create or replace function public.lockdown_protected_columns()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  -- Trusted execution contexts bypass all column protection:
  --   postgres      → SECURITY DEFINER RPCs (complete_date_atomic, record_checkin …)
  --   service_role  → Supabase admin client used by server actions / webhooks / cron
  --   supabase_admin→ direct admin connections / migration runner
  if current_user in ('postgres', 'service_role', 'supabase_admin') then
    return new;
  end if;

  -- Billing / subscription state
  new.plan_type               := old.plan_type;
  new.stripe_customer_id      := old.stripe_customer_id;
  new.subscription_ends_at    := old.subscription_ends_at;

  -- Gamification counters
  new.total_xp                := old.total_xp;
  new.dates_completed_count   := old.dates_completed_count;
  new.total_rerolls_used      := old.total_rerolls_used;
  new.total_checkins          := old.total_checkins;

  -- Reveal / date workflow state
  new.revealed_at             := old.revealed_at;
  new.date_idea               := old.date_idea;
  new.date_teaser             := old.date_teaser;
  new.date_accepted_at        := old.date_accepted_at;
  new.current_date_rerolled   := old.current_date_rerolled;
  new.reveal_owner_ready_at   := old.reveal_owner_ready_at;
  new.reveal_partner_ready_at := old.reveal_partner_ready_at;

  -- Check-in state
  new.checkin_owner_at        := old.checkin_owner_at;
  new.checkin_partner_at      := old.checkin_partner_at;
  new.checkin_owner_skipped   := old.checkin_owner_skipped;
  new.checkin_partner_skipped := old.checkin_partner_skipped;

  -- Notification state
  new.notification_sent_at    := old.notification_sent_at;
  new.partner_ping_sent_at    := old.partner_ping_sent_at;
  new.reminder_sent_at        := old.reminder_sent_at;      -- 066: added 059, never protected
  new.reengagement_sent_at    := old.reengagement_sent_at;  -- 066: added 065, never protected
  new.email_notifications     := old.email_notifications;   -- 066: added 050, never protected

  -- Plan-gated preferences
  new.cadence                 := old.cadence;
  new.preferred_radius        := old.preferred_radius;      -- 066: free-plan radius gate

  -- Account state
  new.onboarding_complete     := old.onboarding_complete;

  return new;
end;
$$;

-- Trigger definition is unchanged from mig 015 (name prefixed 'l' so it fires
-- before protect_revealed_at_trigger). Re-stated for idempotency on a DB
-- provisioned from partial history.
drop trigger if exists lockdown_protected_columns_trigger on public.profiles;

create trigger lockdown_protected_columns_trigger
  before update on public.profiles
  for each row
  execute function public.lockdown_protected_columns();


-- ── 3. Revoke stale date_ideas write grants (F11) ───────────────────────────
--
-- Mig 057 dropped every INSERT/UPDATE policy on date_ideas. All writes go via
-- service_role (admin client) or SECURITY DEFINER RPCs, which bypass RLS.
-- The grants are inert under RLS today but must not survive as a trap.

revoke insert, update on public.date_ideas from authenticated;
-- SELECT retained: clients read the date card in RSC and client components.

-- Same reasoning for date_photos (mig 057 dropped its INSERT policy).
revoke insert on public.date_photos from authenticated;


-- ── Verification ────────────────────────────────────────────────────────────
-- Run after applying. Expect zero rows from each.
--
-- 1. Every profiles column present in the lockdown trigger body, or in the
--    known-mutable allowlist. Any row returned is a NEW drift.
--
--   select c.column_name
--   from information_schema.columns c
--   where c.table_schema = 'public' and c.table_name = 'profiles'
--     and c.column_name not in (
--       'id','created_at','updated_at',
--       'partner_names','interests','constraints','last_lat','last_long',
--       'rating','feedback'
--     )
--     and position('new.' || c.column_name || ' ' in
--           (select prosrc from pg_proc where proname = 'lockdown_protected_columns')) = 0
--     and position('new.' || c.column_name || E'\t' in
--           (select prosrc from pg_proc where proname = 'lockdown_protected_columns')) = 0;
--
-- 2. No rows violate the new radius gate.
--
--   select id, plan_type, preferred_radius from public.profiles
--   where not (
--     (plan_type in ('subscription','trial') and preferred_radius between 1000 and 50000)
--     or (plan_type not in ('subscription','trial') and preferred_radius between 1000 and 15000)
--   );
--
-- 3. authenticated holds no write grants on date_ideas / date_photos.
--
--   select table_name, privilege_type from information_schema.role_table_grants
--   where grantee = 'authenticated'
--     and table_name in ('date_ideas','date_photos')
--     and privilege_type in ('INSERT','UPDATE');
