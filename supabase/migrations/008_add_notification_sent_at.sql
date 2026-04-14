-- Track when the "date ready" notification email was last sent.
-- Reset to NULL when a new date is revealed so the next cycle gets a fresh notification.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS notification_sent_at TIMESTAMPTZ DEFAULT NULL;
