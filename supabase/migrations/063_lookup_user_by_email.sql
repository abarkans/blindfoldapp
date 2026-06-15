-- ============================================================
-- Migration 063: Email-to-user-ID lookup for public deletion flow
-- ============================================================
-- The unauthenticated /delete-account page needs to resolve an email
-- address to an auth user ID so it can issue a deletion token and send
-- a confirmation email. Direct auth.users queries are not exposed to
-- the JS client, so we wrap the lookup in a SECURITY DEFINER function
-- callable only by service_role (admin client).

create or replace function public.get_user_id_by_email(p_email text)
returns uuid
language sql
security definer
set search_path = ''
as $$
  select id
  from auth.users
  where lower(email) = lower(p_email)
  limit 1;
$$;

revoke execute on function public.get_user_id_by_email(text) from public;
revoke execute on function public.get_user_id_by_email(text) from anon;
revoke execute on function public.get_user_id_by_email(text) from authenticated;
grant  execute on function public.get_user_id_by_email(text) to service_role;
