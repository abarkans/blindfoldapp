-- Date ideas history table (one row per reveal per couple)
create table public.date_ideas (
  id           uuid default gen_random_uuid() primary key,
  user_id      uuid references public.profiles(id) on delete cascade not null,
  idea         jsonb not null,
  status       text not null default 'pending', -- pending | revealed | completed | skipped
  generated_at timestamptz not null default now(),
  revealed_at  timestamptz
);

-- Row Level Security
alter table public.date_ideas enable row level security;

create policy "Users can view own date ideas"
  on public.date_ideas for select
  using (auth.uid() = user_id);

create policy "Users can insert own date ideas"
  on public.date_ideas for insert
  with check (auth.uid() = user_id);

create policy "Users can update own date ideas"
  on public.date_ideas for update
  using (auth.uid() = user_id);

-- Index for fast lookup of user's ideas ordered by time
create index date_ideas_user_id_generated_at_idx
  on public.date_ideas (user_id, generated_at desc);
