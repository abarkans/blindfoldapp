alter table public.profiles
  add column if not exists date_teaser jsonb;

create or replace function public.lockdown_protected_columns()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if current_user in ('postgres', 'service_role', 'supabase_admin') then
    return new;
  end if;

  new.plan_type               := old.plan_type;
  new.stripe_customer_id      := old.stripe_customer_id;
  new.total_xp                := old.total_xp;
  new.dates_completed_count   := old.dates_completed_count;
  new.total_rerolls_used      := old.total_rerolls_used;
  new.current_date_rerolled   := old.current_date_rerolled;
  new.subscription_ends_at    := old.subscription_ends_at;
  new.notification_sent_at    := old.notification_sent_at;
  new.revealed_at             := old.revealed_at;
  new.date_idea               := old.date_idea;
  new.date_teaser             := old.date_teaser;
  new.date_accepted_at        := old.date_accepted_at;
  new.onboarding_complete     := old.onboarding_complete;
  new.reveal_owner_ready_at   := old.reveal_owner_ready_at;
  new.reveal_partner_ready_at := old.reveal_partner_ready_at;

  return new;
end;
$$;
