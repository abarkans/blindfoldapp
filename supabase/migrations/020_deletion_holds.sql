-- ============================================================
-- Migration 020: Deletion holds — preserve reveal cooldown across delete+resignup
-- ============================================================
-- When a user deletes their account while a reveal cooldown is still
-- active, we persist a hash of their email so the cooldown carries
-- over if they sign up again with the same email. Stores no PII.

create table public.deletion_holds (
  id_hash text primary key,
  revealed_at timestamptz not null,
  cadence text not null,
  expires_at timestamptz not null,
  created_at timestamptz default now()
);

alter table public.deletion_holds enable row level security;
-- No policies → service_role only.

create index deletion_holds_expires_at_idx
  on public.deletion_holds (expires_at);
