-- Finds profiles orphaned by the pre-fix acceptPartnerInvite() behaviour.
--
-- Before the F3 fix, accepting a partner invite deleted the invitee's own
-- 'owner' row from couple_members without checking what was attached to it.
-- That leaves a profile with ZERO couple_members rows: getCoupleAccess() can
-- no longer resolve anyone to it, so the row and everything hanging off it
-- (completed dates, XP, badges, R2 photos, stripe_customer_id) is unreachable
-- from the app.
--
-- Run in the Supabase SQL editor. Read-only.

-- ── 1. Orphaned profiles that lost something that matters ───────────────────
-- These are the users to contact. stripe_customer_id present is the urgent
-- case: they may still be billed with no in-app way to cancel.

select
  p.id                                                as orphaned_profile_id,
  u.email                                             as owner_email,
  p.plan_type,
  p.stripe_customer_id,
  p.dates_completed_count,
  p.total_xp,
  p.created_at,
  -- where the user ended up after accepting
  cm_now.profile_id                                   as now_partner_of,
  (select count(*) from public.date_photos dp
    where dp.profile_id = p.id)                       as stranded_photo_rows
from public.profiles p
join auth.users u on u.id = p.id
left join public.couple_members cm_now
  on cm_now.user_id = p.id and cm_now.role = 'partner'
where not exists (
  select 1 from public.couple_members cm where cm.profile_id = p.id
)
and (
  p.stripe_customer_id is not null
  or p.plan_type = 'subscription'
  or p.dates_completed_count > 0
  or p.total_xp > 0
)
order by
  (p.stripe_customer_id is not null) desc,   -- billing cases first
  p.dates_completed_count desc;


-- ── 2. Orphaned profiles with nothing attached (informational) ──────────────
-- Expected and harmless: empty shells auto-created by getCoupleAccess() on
-- first dashboard visit, then cleaned up on accept. Count only.

select count(*) as empty_orphaned_shells
from public.profiles p
where not exists (
  select 1 from public.couple_members cm where cm.profile_id = p.id
)
and p.stripe_customer_id is null
and p.plan_type <> 'subscription'
and coalesce(p.dates_completed_count, 0) = 0
and coalesce(p.total_xp, 0) = 0;


-- ── Recovery ────────────────────────────────────────────────────────────────
-- For a user in query 1 who wants their ORIGINAL account back, restoring the
-- owner row makes it reachable again. This also removes them from their
-- partner's couple, so confirm with the user before running.
--
--   begin;
--     delete from public.couple_members
--       where user_id = '<USER_ID>' and role = 'partner';
--     insert into public.couple_members (profile_id, user_id, role)
--       values ('<USER_ID>', '<USER_ID>', 'owner')
--       on conflict do nothing;
--   commit;
--
-- For a billing-only case where the user is happy in the new couple and just
-- needs the subscription cancelled, cancel it in the Stripe dashboard using
-- the stripe_customer_id from query 1 — no DB change required.
