-- 064: app_feedback — general product feedback (bugs/ideas/other), distinct from
-- per-date rating+comment already stored on date_ideas. No read policy: reviewed
-- via Supabase dashboard directly.

create table public.app_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in ('bug', 'idea', 'other')),
  message text not null,
  platform text,
  created_at timestamptz not null default now()
);

alter table public.app_feedback enable row level security;

create policy "users can insert own feedback"
  on public.app_feedback for insert
  with check (user_id = auth.uid());

grant insert on public.app_feedback to authenticated;
