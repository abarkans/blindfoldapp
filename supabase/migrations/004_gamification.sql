-- ============================================================
-- Migration 004: Gamification — XP, Milestones, Badges
-- ============================================================

-- 1. Add XP columns to profiles
alter table public.profiles
  add column if not exists total_xp integer not null default 0,
  add column if not exists dates_completed_count integer not null default 0;

-- 2. Milestones reference table
create table if not exists public.milestones (
  id             uuid default gen_random_uuid() primary key,
  name           text not null,
  description    text not null,
  icon_emoji     text not null,
  required_dates integer not null unique
);

insert into public.milestones (name, description, icon_emoji, required_dates) values
  ('First Spark',   'Completed your very first mystery date!',             '✨', 1),
  ('Triple Threat', 'Three mystery dates in the books!',                   '🔥', 3),
  ('High Five',     'Five dates and counting — you''re on fire!',          '🖐️', 5),
  ('Perfect 10',    'Ten mystery dates completed. Legendary!',             '💎', 10)
on conflict (required_dates) do nothing;

-- 3. User badges join table
create table if not exists public.user_badges (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references public.profiles(id) on delete cascade not null,
  milestone_id uuid references public.milestones(id) on delete cascade not null,
  earned_at   timestamptz not null default now(),
  unique (user_id, milestone_id)
);

-- 4. Row Level Security
alter table public.milestones  enable row level security;
alter table public.user_badges enable row level security;

create policy "milestones are viewable by authenticated users"
  on public.milestones for select
  using (auth.role() = 'authenticated');

create policy "users can view own badges"
  on public.user_badges for select
  using (auth.uid() = user_id);

-- 5. Trigger function: award milestone badges when dates_completed_count increments
--    Runs as SECURITY DEFINER so it can insert into user_badges bypassing RLS.
create or replace function public.award_milestone_badges()
returns trigger language plpgsql security definer as $$
begin
  insert into public.user_badges (user_id, milestone_id)
  select new.id, m.id
  from public.milestones m
  where m.required_dates <= new.dates_completed_count
    and not exists (
      select 1 from public.user_badges ub
      where ub.user_id = new.id
        and ub.milestone_id = m.id
    )
  on conflict (user_id, milestone_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_dates_completed_update on public.profiles;
create trigger on_dates_completed_update
  after update of dates_completed_count on public.profiles
  for each row
  when (new.dates_completed_count > old.dates_completed_count)
  execute function public.award_milestone_badges();
