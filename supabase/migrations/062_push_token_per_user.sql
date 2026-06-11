-- Move push_token to couple_members so each user has their own token
ALTER TABLE public.couple_members
  ADD COLUMN IF NOT EXISTS push_token text;
