alter table public.profiles
  drop constraint if exists profiles_interests_max_10;

alter table public.profiles
  add constraint profiles_interests_max_12
  check (cardinality(interests) <= 12);
