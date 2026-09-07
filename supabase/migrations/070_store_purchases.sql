-- ============================================================
-- Migration 070: Store purchases (one-off digital downloads)
-- ============================================================
-- Guest checkout: the buyer needs no account. Stripe Checkout runs in
-- mode='payment', collects the email itself, and the webhook writes the row
-- here and mails a one-time claim link.
--
-- ACCESS MODEL mirrors account_deletion_tokens (022): RLS on, NO policies, no
-- grants to anon/authenticated -- the table is reachable only through the
-- service-role admin client. A guest buyer has no auth.uid(), so there is
-- nothing for a policy to match on; the claim token IS the credential and it
-- is verified in application code before any admin query runs. Migration 068
-- already revoked the Supabase default grants, so a new table is invisible to
-- the Data API unless explicitly granted. Nothing is granted here on purpose.
--
-- SECURITY
--   - claim_token_hash holds SHA-256 of a 32-byte random token. The plaintext
--     exists only inside the fulfilment email. Unique, so lookup is an index
--     probe rather than a scan (and no two purchases can collide).
--   - stripe_session_id is unique: fulfilment must be idempotent at the ROW
--     level, not only at the event level. The webhook's crash-remnant re-claim
--     path (058) deliberately re-processes events older than 30s, so the
--     `on conflict do nothing` insert is what prevents a duplicate row and a
--     duplicate email.
--   - user_id is a convenience link, set only when the buyer's email already
--     matches an account. Nullable by design (guest purchase is the norm) and
--     `on delete set null` so a deleted account does not destroy a paid
--     entitlement -- the claim link must keep working.
-- ============================================================

create table if not exists public.store_purchases (
  id                       uuid        primary key default gen_random_uuid(),
  stripe_session_id        text        not null unique,
  stripe_payment_intent_id text,
  product_id               text        not null,
  email                    text        not null,
  user_id                  uuid        references auth.users(id) on delete set null,
  amount_total             integer,
  currency                 text,
  claim_token_hash         text        not null unique,
  claimed_at               timestamptz,
  download_count           integer     not null default 0,
  last_downloaded_at       timestamptz,
  created_at               timestamptz not null default now()
);

-- Email is stored lowercased by the application; the index matches that form so
-- the "show me everything this signed-in address has bought" lookup stays cheap.
create index if not exists store_purchases_email_idx
  on public.store_purchases (email);

create index if not exists store_purchases_user_id_idx
  on public.store_purchases (user_id);

alter table public.store_purchases enable row level security;
