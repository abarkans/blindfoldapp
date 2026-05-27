-- ============================================================
-- Migration 055: Restore lockdown trigger + harden date_photos RLS
-- ============================================================
--
-- Lockdown trigger regressions fixed:
--   - cadence: added in mig 024, dropped in mig 028
--   - date_teaser: added in mig 028, dropped in mig 032
--   - reveal_owner_ready_at: added in mig 028, dropped in mig 032
--   - reveal_partner_ready_at: added in mig 028, dropped in mig 032
--   - partner_ping_sent_at: added in mig 051, never added to lockdown
--
-- Without these, an authenticated browser client can:
--   1. Set reveal_*_ready_at directly → bypass partner consent in reveal flow
--   2. Set cadence = 'weekly' → reduce reveal cooldown 4× on any plan
--   3. Set partner_ping_sent_at = null → bypass nudge rate-limit
--
-- date_photos INSERT policy hardened:
--   The old policy only checked couple membership. An authenticated client
--   could insert a fake row (with any r2_key, skipped=false) and satisfy
--   complete_date_atomic's photo-count guard without uploading anything.
--   New policy additionally requires:
--     a) The referenced date_idea is currently in 'revealed' status
--     b) The inserting user has not skipped their check-in
--   All server-action inserts go via the admin client (service_role) and
--   bypass RLS entirely, so this change only affects direct client calls.
-- ============================================================

-- ── Lockdown trigger ────────────────────────────────────────────────────────

create or replace function public.lockdown_protected_columns()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  -- Trusted execution contexts bypass all column protection:
  --   postgres      → SECURITY DEFINER RPCs (complete_date_atomic, record_checkin …)
  --   service_role  → Supabase admin client used by server actions / webhooks / cron
  --   supabase_admin→ direct admin connections / migration runner
  if current_user in ('postgres', 'service_role', 'supabase_admin') then
    return new;
  end if;

  -- Billing / subscription state
  new.plan_type             := old.plan_type;
  new.stripe_customer_id    := old.stripe_customer_id;
  new.subscription_ends_at  := old.subscription_ends_at;

  -- Gamification counters
  new.total_xp              := old.total_xp;
  new.dates_completed_count := old.dates_completed_count;
  new.total_rerolls_used    := old.total_rerolls_used;
  new.total_checkins        := old.total_checkins;

  -- Reveal / date workflow state
  new.revealed_at           := old.revealed_at;
  new.date_idea             := old.date_idea;
  new.date_teaser           := old.date_teaser;           -- restored: dropped in mig 032
  new.date_accepted_at      := old.date_accepted_at;
  new.current_date_rerolled := old.current_date_rerolled;
  new.reveal_owner_ready_at := old.reveal_owner_ready_at; -- restored: dropped in mig 032
  new.reveal_partner_ready_at := old.reveal_partner_ready_at; -- restored: dropped in mig 032

  -- Check-in state
  new.checkin_owner_at      := old.checkin_owner_at;
  new.checkin_partner_at    := old.checkin_partner_at;
  new.checkin_owner_skipped := old.checkin_owner_skipped;
  new.checkin_partner_skipped := old.checkin_partner_skipped;

  -- Notification state
  new.notification_sent_at  := old.notification_sent_at;
  new.partner_ping_sent_at  := old.partner_ping_sent_at; -- new: added in mig 051, never protected

  -- Reveal cadence (restored: added in mig 024, dropped in mig 028)
  -- Free users could set cadence='weekly' to cut their reveal cooldown 4×.
  new.cadence               := old.cadence;

  -- Account state
  new.onboarding_complete   := old.onboarding_complete;

  return new;
end;
$$;

-- ── date_photos INSERT policy ────────────────────────────────────────────────

drop policy if exists "users can insert own date photos" on public.date_photos;

create policy "users can insert own date photos"
  on public.date_photos for insert
  with check (
    -- Must be the uploader
    uploader_user_id = (select auth.uid())

    -- Must be a member of the couple that owns this profile
    and exists (
      select 1
      from   public.couple_members cm
      where  cm.profile_id = date_photos.profile_id
        and  cm.user_id    = (select auth.uid())
    )

    -- The date must currently be in 'revealed' state (not pending/completed/skipped).
    -- Prevents attaching photos to historical or future dates.
    and exists (
      select 1
      from   public.date_ideas di
      where  di.id       = date_photos.date_idea_id
        and  di.user_id  = date_photos.profile_id
        and  di.status   = 'revealed'
    )

    -- Block if this caller's check-in was a skip.
    -- Skipped users cannot upload or claim a real photo row; the server action
    -- enforces the same check but this closes the direct-client bypass path.
    and not exists (
      select 1
      from   public.couple_members cm
      join   public.profiles       p  on p.id = cm.profile_id
      where  cm.profile_id = date_photos.profile_id
        and  cm.user_id    = (select auth.uid())
        and  (
               (cm.role = 'owner'   and p.checkin_owner_skipped   = true)
            or (cm.role = 'partner' and p.checkin_partner_skipped = true)
             )
    )
  );
