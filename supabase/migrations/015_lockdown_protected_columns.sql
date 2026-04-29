-- ============================================================
-- Migration 015: Lockdown of Protected Profile Columns
-- ============================================================
-- Background:
--   The "Users can update own profile" RLS policy on public.profiles
--   uses USING (auth.uid() = id) only. With no column-level grants and
--   no WITH CHECK, an authenticated user can call
--     supabase.from("profiles").update({ plan_type: "subscription" })
--   directly from the browser using the anon key, bypassing every
--   server action and the Stripe webhook. The same path lets users
--   self-set total_xp, total_rerolls_used, current_date_rerolled,
--   stripe_customer_id, etc.
--
-- Approach:
--   A BEFORE UPDATE trigger reverts changes to protected columns when
--   the calling role is not trusted. Trusted roles are postgres
--   (the function-definer context for SECURITY DEFINER RPCs such as
--   complete_date_atomic) and service_role (used by the Stripe
--   webhook, cron, and server actions that explicitly use the admin
--   client). Authenticated and anon roles are subject to the lockdown.
--
-- Trigger ordering:
--   This trigger is named with an "l" prefix so it fires before
--   protect_revealed_at_trigger (alphabetical order). After this
--   trigger reverts new.revealed_at, the protect_revealed_at trigger
--   sees no change and is a no-op for authenticated callers, which
--   preserves its existing behaviour for service-role writes.

create or replace function public.lockdown_protected_columns()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  -- Trusted execution contexts:
  --   - 'postgres'      : SECURITY DEFINER functions owned by postgres
  --   - 'service_role'  : Supabase admin client (service-role JWT)
  --   - 'supabase_admin': direct admin connections / migrations
  if current_user in ('postgres', 'service_role', 'supabase_admin') then
    return new;
  end if;

  -- Authenticated/anon callers cannot mutate any of these columns.
  -- Any attempted change is silently reverted to the prior value so
  -- normal updates to user-mutable columns still succeed.
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

  return new;
end;
$$;

drop trigger if exists lockdown_protected_columns_trigger on public.profiles;

create trigger lockdown_protected_columns_trigger
  before update on public.profiles
  for each row
  execute function public.lockdown_protected_columns();
