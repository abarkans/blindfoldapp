-- Track when the first-date reminder email was sent.
-- NULL = not yet sent. Set once; never reset (one-time nudge).
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ DEFAULT NULL;
