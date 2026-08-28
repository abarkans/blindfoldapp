-- ============================================================
-- Migration 067: Lock the two push columns missed by 066
-- ============================================================
-- Found by running migration 066's own drift-detection query, which diffs the
-- profiles column list against the lockdown_protected_columns() body. Fifth
-- occurrence of this drift; see 066's header for the running history.
--
--   push_notifications_enabled (061) — LIVE. app/actions/reveal.ts:432 gates the
--       partner push on it:
--           if (token && pushProfile?.push_notifications_enabled !== false)
--       It lives on the couple's SHARED profile row and no code path writes it,
--       so it is permanently true by default. Unprotected, either partner could
--       run
--           supabase.from('profiles')
--             .update({ push_notifications_enabled: false })
--             .eq('id', profileId)
--       from devtools and silently disable push for both of them. Same class as
--       email_notifications, which 066 locked — this belonged in that set.
--
--   push_token (061) — VESTIGIAL. Migration 062 moved the real token to
--       couple_members.push_token and left this column behind. Every live path
--       uses the couple_members copy (api/push/register/route.ts:27,
--       actions/reveal.ts:422). Nothing reads profiles.push_token.
--       Locked rather than dropped: app/dashboard/page.tsx:22 still names the
--       column in an explicit select list, so a DROP would break the dashboard
--       until that select and lib/types.ts are updated. Tracked as cleanup —
--       see the commented DROP at the bottom.
--
-- If a push-notification toggle is added to Settings later, write it through a
-- server action using createAdminClient() (service_role), exactly as
-- app/actions/update-email-notifications.ts does. service_role bypasses this
-- trigger, so locking the column here does not block that feature.
-- ============================================================

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
  new.plan_type               := old.plan_type;
  new.stripe_customer_id      := old.stripe_customer_id;
  new.subscription_ends_at    := old.subscription_ends_at;

  -- Gamification counters
  new.total_xp                := old.total_xp;
  new.dates_completed_count   := old.dates_completed_count;
  new.total_rerolls_used      := old.total_rerolls_used;
  new.total_checkins          := old.total_checkins;

  -- Reveal / date workflow state
  new.revealed_at             := old.revealed_at;
  new.date_idea               := old.date_idea;
  new.date_teaser             := old.date_teaser;
  new.date_accepted_at        := old.date_accepted_at;
  new.current_date_rerolled   := old.current_date_rerolled;
  new.reveal_owner_ready_at   := old.reveal_owner_ready_at;
  new.reveal_partner_ready_at := old.reveal_partner_ready_at;

  -- Check-in state
  new.checkin_owner_at        := old.checkin_owner_at;
  new.checkin_partner_at      := old.checkin_partner_at;
  new.checkin_owner_skipped   := old.checkin_owner_skipped;
  new.checkin_partner_skipped := old.checkin_partner_skipped;

  -- Notification state
  new.notification_sent_at    := old.notification_sent_at;
  new.partner_ping_sent_at    := old.partner_ping_sent_at;
  new.reminder_sent_at        := old.reminder_sent_at;
  new.reengagement_sent_at    := old.reengagement_sent_at;
  new.email_notifications     := old.email_notifications;
  new.push_notifications_enabled := old.push_notifications_enabled; -- 067
  new.push_token              := old.push_token;                    -- 067 (vestigial)

  -- Plan-gated preferences
  new.cadence                 := old.cadence;
  new.preferred_radius        := old.preferred_radius;

  -- Account state
  new.onboarding_complete     := old.onboarding_complete;

  return new;
end;
$$;

drop trigger if exists lockdown_protected_columns_trigger on public.profiles;

create trigger lockdown_protected_columns_trigger
  before update on public.profiles
  for each row
  execute function public.lockdown_protected_columns();


-- ── Cleanup, NOT run here ───────────────────────────────────────────────────
-- profiles.push_token has been dead since migration 062 but still holds stale
-- device tokens. Dropping it requires two code changes first:
--   1. remove "push_token" from the select list in app/dashboard/page.tsx:22
--   2. regenerate / edit lib/types.ts
-- Once both are deployed:
--
--   alter table public.profiles drop column if exists push_token;
--
-- Do it in that order — dropping first breaks the dashboard select immediately.


-- ── Verification ────────────────────────────────────────────────────────────
-- Re-run 066's drift query; it should now return zero rows.
--
--   select c.column_name
--   from information_schema.columns c
--   where c.table_schema = 'public' and c.table_name = 'profiles'
--     and c.column_name not in (
--       'id','created_at','updated_at',
--       'partner_names','interests','constraints','last_lat','last_long',
--       'rating','feedback'
--     )
--     and (select prosrc from pg_proc where proname = 'lockdown_protected_columns')
--         not like '%new.' || c.column_name || '%';
