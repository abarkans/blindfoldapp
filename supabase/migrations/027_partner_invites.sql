-- Partner invites and shared couple access.

alter table public.profiles
  add column if not exists reveal_owner_ready_at timestamptz,
  add column if not exists reveal_partner_ready_at timestamptz;

create table if not exists public.couple_members (
  profile_id uuid references public.profiles(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text not null check (role in ('owner', 'partner')),
  created_at timestamptz not null default now(),
  primary key (profile_id, user_id)
);

create unique index if not exists couple_members_one_owner
  on public.couple_members(profile_id)
  where role = 'owner';

create unique index if not exists couple_members_one_partner
  on public.couple_members(profile_id)
  where role = 'partner';

create unique index if not exists couple_members_one_partner_membership
  on public.couple_members(user_id)
  where role = 'partner';

create table if not exists public.partner_invites (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  inviter_user_id uuid references auth.users(id) on delete cascade not null,
  invited_email text not null,
  token_hash text not null unique,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  accepted_user_id uuid references auth.users(id) on delete set null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists partner_invites_profile_created_idx
  on public.partner_invites(profile_id, created_at desc);

create index if not exists partner_invites_token_hash_idx
  on public.partner_invites(token_hash);

alter table public.couple_members enable row level security;
alter table public.partner_invites enable row level security;

insert into public.couple_members (profile_id, user_id, role)
select id, id, 'owner'
from public.profiles
on conflict do nothing;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict do nothing;

  insert into public.couple_members (profile_id, user_id, role)
  values (new.id, new.id, 'owner')
  on conflict do nothing;

  return new;
end;
$$;

create policy "Members can view couple members"
  on public.couple_members for select
  using (
    user_id = (select auth.uid())
    or exists (
      select 1 from public.couple_members cm
      where cm.profile_id = couple_members.profile_id
        and cm.user_id = (select auth.uid())
    )
  );

create policy "Members can view shared profile"
  on public.profiles for select
  using (
    exists (
      select 1 from public.couple_members cm
      where cm.profile_id = profiles.id
        and cm.user_id = (select auth.uid())
    )
  );

create policy "Members can update shared profile"
  on public.profiles for update
  using (
    exists (
      select 1 from public.couple_members cm
      where cm.profile_id = profiles.id
        and cm.user_id = (select auth.uid())
    )
  );

create policy "Members can view shared date ideas"
  on public.date_ideas for select
  using (
    exists (
      select 1 from public.couple_members cm
      where cm.profile_id = date_ideas.user_id
        and cm.user_id = (select auth.uid())
    )
  );

create policy "Members can update shared date ideas"
  on public.date_ideas for update
  using (
    exists (
      select 1 from public.couple_members cm
      where cm.profile_id = date_ideas.user_id
        and cm.user_id = (select auth.uid())
    )
  );

create policy "Members can view shared badges"
  on public.user_badges for select
  using (
    exists (
      select 1 from public.couple_members cm
      where cm.profile_id = user_badges.user_id
        and cm.user_id = (select auth.uid())
    )
  );

create or replace function public.lockdown_protected_columns()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if current_user in ('postgres', 'service_role', 'supabase_admin') then
    return new;
  end if;

  new.plan_type               := old.plan_type;
  new.stripe_customer_id      := old.stripe_customer_id;
  new.total_xp                := old.total_xp;
  new.dates_completed_count   := old.dates_completed_count;
  new.total_rerolls_used      := old.total_rerolls_used;
  new.current_date_rerolled   := old.current_date_rerolled;
  new.subscription_ends_at    := old.subscription_ends_at;
  new.notification_sent_at    := old.notification_sent_at;
  new.revealed_at             := old.revealed_at;
  new.date_idea               := old.date_idea;
  new.date_accepted_at        := old.date_accepted_at;
  new.onboarding_complete     := old.onboarding_complete;
  new.reveal_owner_ready_at   := old.reveal_owner_ready_at;
  new.reveal_partner_ready_at := old.reveal_partner_ready_at;

  return new;
end;
$$;
