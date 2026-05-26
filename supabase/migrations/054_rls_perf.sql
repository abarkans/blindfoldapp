-- ============================================================
-- Migration 054: RLS performance — auth initplan + policy merges
-- ============================================================
-- Two classes of linter warnings fixed here:
--
-- 1. auth_rls_initplan (0003)
--    auth.uid() called bare in a USING/WITH CHECK expression is
--    re-evaluated for every row. Wrapping in (select auth.uid())
--    forces Postgres to evaluate it once per statement as an
--    InitPlan, not once per row as a correlated subquery.
--    Already correct in the "Members can …" policies (mig 027).
--
-- 2. multiple_permissive_policies (0006)
--    Two permissive policies on the same table+role+action are
--    ORed together by the planner, but each policy is still
--    planned and executed separately — 2× the work. Merging them
--    into one policy with an explicit OR is equivalent logically
--    and cheaper to execute.
--
-- Affected tables / policies:
--   profiles    SELECT  merge "Users can view own" + "Members can view shared"
--   profiles    UPDATE  merge "Users can update own" + "Members can update shared"
--   profiles    INSERT  initplan fix only (no partner INSERT policy)
--   date_ideas  SELECT  merge "Users can view own" + "Members can view shared"
--   date_ideas  UPDATE  merge "Users can update own" + "Members can update shared"
--   date_ideas  INSERT  initplan fix only
--   user_badges SELECT  merge "users can view own" + "Members can view shared"
--   date_photos SELECT  initplan fix only (single policy)
--   date_photos INSERT  initplan fix only (single policy)

-- ── profiles ─────────────────────────────────────────────────────────────────

drop policy if exists "Users can view own profile"      on public.profiles;
drop policy if exists "Members can view shared profile" on public.profiles;
create policy "owner or couple member can select profile"
  on public.profiles for select
  using (
    (select auth.uid()) = id
    or exists (
      select 1 from public.couple_members cm
      where cm.profile_id = profiles.id
        and cm.user_id = (select auth.uid())
    )
  );

drop policy if exists "Users can update own profile"      on public.profiles;
drop policy if exists "Members can update shared profile" on public.profiles;
create policy "owner or couple member can update profile"
  on public.profiles for update
  using (
    (select auth.uid()) = id
    or exists (
      select 1 from public.couple_members cm
      where cm.profile_id = profiles.id
        and cm.user_id = (select auth.uid())
    )
  );

-- INSERT: single policy, initplan fix only
drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  with check ((select auth.uid()) = id);

-- ── date_ideas ───────────────────────────────────────────────────────────────

drop policy if exists "Users can view own date ideas"      on public.date_ideas;
drop policy if exists "Members can view shared date ideas" on public.date_ideas;
create policy "owner or couple member can select date ideas"
  on public.date_ideas for select
  using (
    (select auth.uid()) = user_id
    or exists (
      select 1 from public.couple_members cm
      where cm.profile_id = date_ideas.user_id
        and cm.user_id = (select auth.uid())
    )
  );

drop policy if exists "Users can update own date ideas"      on public.date_ideas;
drop policy if exists "Members can update shared date ideas" on public.date_ideas;
create policy "owner or couple member can update date ideas"
  on public.date_ideas for update
  using (
    (select auth.uid()) = user_id
    or exists (
      select 1 from public.couple_members cm
      where cm.profile_id = date_ideas.user_id
        and cm.user_id = (select auth.uid())
    )
  );

-- INSERT: single policy, initplan fix only
drop policy if exists "Users can insert own date ideas" on public.date_ideas;
create policy "Users can insert own date ideas"
  on public.date_ideas for insert
  with check ((select auth.uid()) = user_id);

-- ── user_badges ───────────────────────────────────────────────────────────────

drop policy if exists "users can view own badges"     on public.user_badges;
drop policy if exists "Members can view shared badges" on public.user_badges;
create policy "owner or couple member can select badges"
  on public.user_badges for select
  using (
    (select auth.uid()) = user_id
    or exists (
      select 1 from public.couple_members cm
      where cm.profile_id = user_badges.user_id
        and cm.user_id = (select auth.uid())
    )
  );

-- ── date_photos ───────────────────────────────────────────────────────────────

drop policy if exists "couple members can read date photos" on public.date_photos;
create policy "couple members can read date photos"
  on public.date_photos for select
  using (
    exists (
      select 1 from public.couple_members
      where couple_members.profile_id = date_photos.profile_id
        and couple_members.user_id = (select auth.uid())
    )
  );

drop policy if exists "users can insert own date photos" on public.date_photos;
create policy "users can insert own date photos"
  on public.date_photos for insert
  with check (
    uploader_user_id = (select auth.uid())
    and exists (
      select 1 from public.couple_members
      where couple_members.profile_id = date_photos.profile_id
        and couple_members.user_id = (select auth.uid())
    )
  );
