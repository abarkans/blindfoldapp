-- ============================================================
-- Migration 042: Check-in skip flags
-- ============================================================
-- Distinguishes "skipped check-in" from "physically checked in".
-- Without this, skipCheckIn() and checkInToDate() wrote to the
-- same checkin_owner_at / checkin_partner_at columns, making it
-- impossible to block skippers from uploading photos.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS checkin_owner_skipped   boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS checkin_partner_skipped boolean NOT NULL DEFAULT false;

-- Extend the lockdown trigger to protect the new columns.
CREATE OR REPLACE FUNCTION public.lockdown_protected_columns()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF current_user IN ('postgres', 'service_role', 'supabase_admin') THEN
    RETURN new;
  END IF;

  new.plan_type               := old.plan_type;
  new.stripe_customer_id      := old.stripe_customer_id;
  new.total_xp                := old.total_xp;
  new.dates_completed_count   := old.dates_completed_count;
  new.total_rerolls_used      := old.total_rerolls_used;
  new.current_date_rerolled   := old.current_date_rerolled;
  new.subscription_ends_at    := old.subscription_ends_at;
  new.notification_sent_at    := old.notification_sent_at;
  new.revealed_at             := old.revealed_at;
  new.date_idea               := old.date_idea;
  new.date_accepted_at        := old.date_accepted_at;
  new.onboarding_complete     := old.onboarding_complete;
  new.checkin_owner_at        := old.checkin_owner_at;
  new.checkin_partner_at      := old.checkin_partner_at;
  new.total_checkins          := old.total_checkins;
  new.checkin_owner_skipped   := old.checkin_owner_skipped;
  new.checkin_partner_skipped := old.checkin_partner_skipped;

  RETURN new;
END;
$$;
