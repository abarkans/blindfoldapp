-- ============================================================
-- Migration 022: Account deletion confirmation tokens
-- ============================================================
-- Account deletion is irreversible (auth.users row + cascading
-- profile/date_ideas/badges removed). The Settings UI used to call
-- deleteAccount() server action directly, which meant a stolen
-- session cookie was sufficient to permanently destroy a user's
-- data. We now require an out-of-band email confirmation step:
--
--   1. requestAccountDeletion() generates a 32-byte token, stores
--      its SHA-256 hash here, and emails the plaintext token in a
--      one-time link.
--   2. confirmAccountDeletion(token) re-hashes the plaintext and
--      looks up this table; row must exist, must not be expired,
--      and user_id must match the current auth.uid().
--
-- Security:
--   - RLS on with no policies — only service_role can read/write.
--     The token hash never leaves the database.
--   - Tokens are single-use; the row is deleted after a successful
--     confirmation, so a leaked link can be replayed at most once
--     within the 15-minute window before it's used.
--   - on delete cascade on user_id ensures stale rows disappear if
--     the user is deleted by another path (admin, SQL).
--
-- Cleanup of expired rows is handled by cleanup_account_deletion_tokens()
-- below, invoked from the daily notify-dates cron.

create table if not exists public.account_deletion_tokens (
  token_hash text        primary key,
  user_id    uuid        not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists account_deletion_tokens_user_id_idx
  on public.account_deletion_tokens (user_id);

create index if not exists account_deletion_tokens_expires_at_idx
  on public.account_deletion_tokens (expires_at);

alter table public.account_deletion_tokens enable row level security;

-- Cleanup helper — invoked by the daily notify-dates cron. Token
-- TTL is 15 minutes so any row past expires_at is unusable.
create or replace function public.cleanup_account_deletion_tokens()
returns int
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_deleted int;
begin
  delete from public.account_deletion_tokens
    where expires_at < now();
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

revoke execute on function public.cleanup_account_deletion_tokens() from public;
grant  execute on function public.cleanup_account_deletion_tokens() to service_role;
