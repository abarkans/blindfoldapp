-- 038: date_photos — stores couple photo memory cards per completed date

create table public.date_photos (
  id uuid primary key default gen_random_uuid(),
  date_idea_id uuid not null,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  uploader_user_id uuid not null references auth.users(id) on delete cascade,
  r2_key text not null,
  created_at timestamptz not null default now(),
  unique (date_idea_id, uploader_user_id)
);

alter table public.date_photos enable row level security;

-- Both owner and partner can read photos for their couple's profile
create policy "couple members can read date photos"
  on public.date_photos for select
  using (
    exists (
      select 1 from public.couple_members
      where couple_members.profile_id = date_photos.profile_id
        and couple_members.user_id = auth.uid()
    )
  );

-- Users can only insert their own photos for their couple's profile
create policy "users can insert own date photos"
  on public.date_photos for insert
  with check (
    uploader_user_id = auth.uid()
    and exists (
      select 1 from public.couple_members
      where couple_members.profile_id = date_photos.profile_id
        and couple_members.user_id = auth.uid()
    )
  );

grant select, insert on public.date_photos to authenticated;
