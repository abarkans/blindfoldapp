-- Add push notification token to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS push_token text,
  ADD COLUMN IF NOT EXISTS push_notifications_enabled boolean NOT NULL DEFAULT true;

-- Users can only update their own push_token via the API (not direct RLS write)
-- The token is written by the server action on behalf of the authenticated user.
-- Grant read access so the server can look it up when sending notifications.
