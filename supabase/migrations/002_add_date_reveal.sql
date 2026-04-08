-- Add reveal tracking to profiles
alter table public.profiles
  add column if not exists revealed_at timestamptz,
  add column if not exists date_idea jsonb;
