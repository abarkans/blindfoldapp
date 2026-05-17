-- 041: Add FK from date_photos.date_idea_id to date_ideas(id).
-- Previously missing, allowing photo rows with arbitrary/non-existent date UUIDs.

alter table public.date_photos
  add constraint date_photos_date_idea_id_fkey
  foreign key (date_idea_id) references public.date_ideas(id) on delete cascade;
