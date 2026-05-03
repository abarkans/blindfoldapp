-- ============================================================
-- Migration 024: Cap interests array + add cadence to lockdown
-- ============================================================
-- Background:
--   1. profiles.interests is plain text[] with no size constraint and the
--      lockdown trigger from migration 015 does not cover it. The Settings
--      panel also writes the array directly via the supabase-js client.
--      An attacker can push thousands of tokens which then balloon the AI
--      prompt at reveal/reroll time, multiplying Anthropic input-token
--      spend. Runtime schema bound now caps to 10 (reveal.ts/reroll.ts);
--      this migration adds the matching DB-level guard.
--
--   2. cadence is allowed in the RLS UPDATE policy and not in the
--      lockdown set, so a free user can run
--        supabase.from('profiles').update({ cadence: 'weekly' })
--      from devtools to cut their reveal cooldown 4x. The legitimate
--      paths that set cadence (finishOnboarding, the upgrade page, the
--      Stripe webhook, and the new updateCadence server action) all go
--      through the admin client / service_role and are unaffected.

alter table public.profiles
  add constraint profiles_interests_max_10
  check (cardinality(interests) <= 10);

create or replace function public.lockdown_protected_columns()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if current_user in ('postgres', 'service_role', 'supabase_admin') then
    return new;
  end if;

  new.plan_type             := old.plan_type;
  new.stripe_customer_id    := old.stripe_customer_id;
  new.total_xp              := old.total_xp;
  new.dates_completed_count := old.dates_completed_count;
  new.total_rerolls_used    := old.total_rerolls_used;
  new.current_date_rerolled := old.current_date_rerolled;
  new.subscription_ends_at  := old.subscription_ends_at;
  new.notification_sent_at  := old.notification_sent_at;
  new.revealed_at           := old.revealed_at;
  new.date_idea             := old.date_idea;
  new.date_accepted_at      := old.date_accepted_at;
  new.onboarding_complete   := old.onboarding_complete;
  -- Added in 024: prevents free-tier devtools cadence shortcut.
  new.cadence               := old.cadence;

  return new;
end;
$$;
