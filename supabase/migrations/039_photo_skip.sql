-- 039: allow skipping the photo step
-- r2_key becomes nullable; skipped flag marks placeholder rows

alter table public.date_photos
  alter column r2_key drop not null,
  add column skipped boolean not null default false;

alter table public.date_photos
  add constraint date_photos_r2_key_or_skipped
  check (r2_key is not null or skipped = true);
