-- ============================================================
-- Migration 005: Location fields for nearby venue search
-- ============================================================

alter table public.profiles
  add column if not exists preferred_radius integer not null default 10000,
  add column if not exists last_lat float8,
  add column if not exists last_long float8;
