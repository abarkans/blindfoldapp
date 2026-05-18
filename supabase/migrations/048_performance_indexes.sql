-- ============================================================
-- Migration 048: Performance indexes
-- ============================================================
-- Covers the hot query paths identified during schema audit.
-- All indexes use IF NOT EXISTS so re-running is safe.

-- Most common date_ideas query: user's revealed/pending idea.
-- Used in complete_date_atomic, reroll, reveal, and badge poll.
create index if not exists idx_date_ideas_user_status
  on public.date_ideas(user_id, status);

-- Badge poll query: earned_at >= now() - interval '10s'
-- Badge grid load: WHERE user_id = ?
-- Composite covers both patterns; DESC on earned_at matches poll ORDER BY.
create index if not exists idx_user_badges_user_earned
  on public.user_badges(user_id, earned_at desc);

-- RLS policies on couple_members check user_id = auth.uid() without
-- a leading profile_id, so the composite PK (profile_id, user_id) cannot
-- serve these lookups. A plain user_id index fixes the seq scan.
create index if not exists idx_couple_members_user_id
  on public.couple_members(user_id);

-- Stripe webhook handler looks up profiles by stripe_customer_id.
-- Partial index excludes NULL rows (most free users have no customer ID).
create index if not exists idx_profiles_stripe_customer_id
  on public.profiles(stripe_customer_id)
  where stripe_customer_id is not null;
