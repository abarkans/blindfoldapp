-- ============================================================
-- Migration 018: Allow trusted roles to roll back revealed_at
-- ============================================================
-- The protect_revealed_at trigger from migration 006 was designed to
-- block client-side rollback of the cadence cooldown — without it an
-- attacker with a valid session could call
--   supabase.from("profiles").update({ revealed_at: null })
-- to bypass the cooldown.
--
-- The lockdown trigger from migration 015 now blocks all
-- authenticated/anon writes to revealed_at outright, so the
-- protect_revealed_at guarantee for clients is already covered.
--
-- However, the new atomic-claim pattern in revealDate() needs to roll
-- back revealed_at to its prior value when AI/Places generation fails
-- after the claim has stamped revealed_at = now(). That rollback is
-- issued through the service-role admin client, which bypasses the
-- lockdown trigger but still hits protect_revealed_at and gets the
-- rollback rejected — leaving the user locked out of reveal until the
-- cadence elapses naturally.
--
-- Fix: protect_revealed_at now bypasses for trusted roles
-- (postgres, service_role, supabase_admin). Authenticated clients
-- continue to hit the lockdown trigger first and have their changes
-- reverted there.

create or replace function public.protect_revealed_at()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  -- Trusted execution contexts can legitimately move revealed_at in
  -- either direction (e.g. atomic-claim rollback on AI failure).
  if current_user in ('postgres', 'service_role', 'supabase_admin') then
    return new;
  end if;

  -- Authenticated/anon callers cannot roll revealed_at back. (In
  -- practice the lockdown trigger from migration 015 has already
  -- reverted such a write before this trigger fires; this remains as
  -- defence in depth.)
  if old.revealed_at is not null
     and (new.revealed_at is null or new.revealed_at < old.revealed_at)
  then
    new.revealed_at = old.revealed_at;
  end if;
  return new;
end;
$$;
