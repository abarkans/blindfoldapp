-- Add email_notifications preference to profiles.
-- Defaults to true (opted in). Users can unsubscribe via email link.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS email_notifications boolean NOT NULL DEFAULT true;
