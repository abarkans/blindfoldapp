-- Migration 037: Subscriber badge — award on plan_type upgrade to subscription

-- 1. Add Subscriber milestone (required_dates=9999 is sentinel — won't be triggered
--    by the date-count trigger, only by the subscription trigger below)
insert into public.milestones (name, description, icon_emoji, required_dates)
values ('Subscriber', 'Joined Blindfold Plus', '⭐', 9999)
on conflict (required_dates) do nothing;

-- 2. Trigger function: award subscriber badge when plan_type becomes 'subscription'
create or replace function public.award_subscriber_badge()
returns trigger language plpgsql security definer as $$
declare
  v_milestone_id uuid;
begin
  if new.plan_type = 'subscription' and (old.plan_type is distinct from 'subscription') then
    select id into v_milestone_id from public.milestones where name = 'Subscriber';
    if v_milestone_id is not null then
      insert into public.user_badges (user_id, milestone_id)
      values (new.id, v_milestone_id)
      on conflict (user_id, milestone_id) do nothing;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists on_plan_type_upgrade on public.profiles;
create trigger on_plan_type_upgrade
  after update of plan_type on public.profiles
  for each row
  execute function public.award_subscriber_badge();

-- 3. Back-fill: award the badge to all existing subscribers who don't have it yet
insert into public.user_badges (user_id, milestone_id)
select p.id, m.id
from public.profiles p
cross join public.milestones m
where p.plan_type = 'subscription'
  and m.name = 'Subscriber'
  and not exists (
    select 1 from public.user_badges ub
    where ub.user_id = p.id and ub.milestone_id = m.id
  )
on conflict (user_id, milestone_id) do nothing;
