-- Track when the 30-day re-engagement email was sent.
-- NULL = not yet sent. Reset to NULL when user reveals a new date so they
-- can receive it again if they go quiet after future dates.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS reengagement_sent_at TIMESTAMPTZ DEFAULT NULL;
