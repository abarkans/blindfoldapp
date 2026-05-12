-- ============================================================
-- Migration 032: Synchronized venue check-in
-- ============================================================
-- Mirrors the reveal_owner_ready_at / reveal_partner_ready_at pattern
-- for both-partner synchronization. Both partners must physically be
-- at the venue (within 200 m) before the date is marked complete.
--
-- total_checkins is a shared couple counter (increments once per date,
-- on the second partner's check-in) — separate from dates_completed_count
-- which is the gamification counter gated on plan_type.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS checkin_owner_at   timestamptz NULL,
  ADD COLUMN IF NOT EXISTS checkin_partner_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS total_checkins     integer NOT NULL DEFAULT 0;

-- Extend lockdown trigger to protect the new columns from direct
-- browser mutations. Trusted callers (service_role / postgres) bypass.
CREATE OR REPLACE FUNCTION public.lockdown_protected_columns()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF current_user IN ('postgres', 'service_role', 'supabase_admin') THEN
    RETURN new;
  END IF;

  new.plan_type             := old.plan_type;
  new.stripe_customer_id    := old.stripe_customer_id;
  new.total_xp              := old.total_xp;
  new.dates_completed_count := old.dates_completed_count;
  new.total_rerolls_used    := old.total_rerolls_used;
  new.current_date_rerolled := old.current_date_rerolled;
  new.subscription_ends_at  := old.subscription_ends_at;
  new.notification_sent_at  := old.notification_sent_at;
  new.revealed_at           := old.revealed_at;
  new.date_idea             := old.date_idea;
  new.date_accepted_at      := old.date_accepted_at;
  new.onboarding_complete   := old.onboarding_complete;
  new.checkin_owner_at      := old.checkin_owner_at;
  new.checkin_partner_at    := old.checkin_partner_at;
  new.total_checkins        := old.total_checkins;

  RETURN new;
END;
$$;
