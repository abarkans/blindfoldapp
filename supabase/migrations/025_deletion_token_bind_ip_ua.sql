-- ============================================================
-- Migration 025: Bind deletion-confirmation tokens to IP/UA
-- ============================================================
-- Background:
--   account_deletion_tokens (migration 022) was bearer-only: a leaked
--   confirmation link plus any active session for the same user was
--   sufficient to complete the irreversible delete. Binding the token
--   to the originating IP and User-Agent at request time and verifying
--   them at confirm time forces an attacker to also pivot to the same
--   network and browser, narrowing the practical window for token
--   replay (15-min TTL was already short; see app for further drop to
--   5 min).
--
-- Notes:
--   - Both columns are nullable so the request endpoint stays robust
--     when no header is present (proxies that strip UA, etc). The app
--     enforces "match if both sides have a value" semantics, never
--     falling through silently when only one side is present.
--   - request_ip stored as text (not inet) so the same value can be
--     used for both v4 and v6 forwarded headers without normalization.
--   - RLS lockdown unchanged; only service_role reads/writes this table.

alter table public.account_deletion_tokens
  add column if not exists request_ip text,
  add column if not exists user_agent text;
