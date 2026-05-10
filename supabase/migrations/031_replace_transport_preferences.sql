alter table public.profiles
  alter column constraints set default '{"budget_max": 50, "date_outside": true, "date_at_home": false}'::jsonb;

update public.profiles
set constraints =
  (constraints - 'has_car' - 'prefers_walking') ||
  jsonb_build_object(
    'date_outside',
    coalesce((constraints->>'date_outside')::boolean, true),
    'date_at_home',
    coalesce((constraints->>'date_at_home')::boolean, false)
  )
where constraints ? 'has_car'
   or constraints ? 'prefers_walking'
   or not constraints ? 'date_outside'
   or not constraints ? 'date_at_home';
