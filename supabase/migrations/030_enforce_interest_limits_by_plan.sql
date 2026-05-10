alter table public.profiles
  drop constraint if exists profiles_interests_max_12;

alter table public.profiles
  drop constraint if exists profiles_interests_by_plan;

update public.profiles
set interests = case
  when cardinality(array(
    select interest
    from unnest(profiles.interests) as interest
    where interest = any (array['food', 'nature', 'romance']::text[])
  )) > 0 then array(
    select interest
    from unnest(profiles.interests) as interest
    where interest = any (array['food', 'nature', 'romance']::text[])
  )
  else array['food', 'nature', 'romance']::text[]
end
where plan_type <> 'subscription'
  and not (
    cardinality(interests) <= 3
    and interests <@ array['food', 'nature', 'romance']::text[]
  );

alter table public.profiles
  add constraint profiles_interests_by_plan
  check (
    (
      plan_type = 'subscription'
      and cardinality(interests) <= 12
    )
    or (
      plan_type <> 'subscription'
      and cardinality(interests) <= 3
      and interests <@ array['food', 'nature', 'romance']::text[]
    )
  );
