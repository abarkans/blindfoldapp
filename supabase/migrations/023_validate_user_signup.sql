-- ============================================================
-- Migration 023: Server-side signup validation
-- ============================================================
-- The disposable-email check, 18+ confirmation, and ToS acceptance
-- previously lived only in the React register form. They were trivial
-- to bypass: any caller hitting Supabase Auth's REST endpoint directly
-- with the public anon key (devtools, curl, scripted bots) skipped the
-- entire check and got a fully provisioned account.
--
-- Approach:
--   BEFORE INSERT trigger on auth.users that:
--     1. Always rejects known disposable email domains, regardless of
--        signup provider. Bot enrolment + free-tier abuse vector.
--     2. For email/password signups (provider = 'email'), requires
--        raw_user_meta_data.age_confirmed = true and
--        raw_user_meta_data.terms_accepted = true. The frontend now
--        passes these via signUp({ options: { data: ... } }).
--     3. OAuth signups (Google etc.) skip the age/terms metadata check
--        because that data isn't available at OAuth callback time.
--        Acceptance for OAuth users is captured at the register page
--        before the OAuth flow starts (button gated on checkboxes).
--
-- The disposable list is duplicated client-side in
-- lib/utils/disposable-emails.ts for fast UX feedback. This SQL list is
-- the authoritative gate — drift is OK because client-side is purely a
-- UX hint, not security.

create or replace function public.validate_user_signup()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_domain   text;
  v_provider text;
  -- Subset of common disposable / temp-mail domains. Keep in sync
  -- (loosely) with lib/utils/disposable-emails.ts. The TS list can drift
  -- broader without harm; this list must contain at minimum the highest-
  -- volume offenders (Mailinator, Guerrilla, Yopmail, 10minutemail,
  -- temp-mail, throwaway, fake-inbox families).
  v_disposable text[] := array[
    '10minutemail.com', '10minutemail.net', '10minemail.com', '20minutemail.com',
    'guerrillamail.com', 'guerrillamail.net', 'guerrillamail.org', 'guerrillamail.biz',
    'guerrillamail.de', 'guerrillamail.info', 'guerrillamailblock.com',
    'grr.la', 'sharklasers.com', 'spam4.me',
    'mailinator.com', 'mailinator.net', 'mailinator.org', 'mailinator2.com',
    'mailinater.com', 'suremail.info', 'spamherelots.com', 'spamhereplease.com',
    'tradermail.info',
    'yopmail.com', 'yopmail.fr', 'cool.fr.nf', 'jetable.fr.nf',
    'tempmail.com', 'tempmail.net', 'tempmail.org', 'temp-mail.org', 'temp-mail.io',
    'tempinbox.com', 'tempemail.com', 'tempemail.net',
    'throwaway.email', 'throwam.com', 'throwbin.io',
    'dispostable.com', 'trashmail.com', 'trashmail.me', 'trashmail.net',
    'trashmail.org', 'trashmail.at', 'trashmail.io', 'trashmail.xyz',
    'fakeinbox.com', 'fakeinbox.net', 'fakemail.fr',
    'mailnull.com', 'spamgourmet.com', 'spamgourmet.net', 'spamgourmet.org',
    'maildrop.cc', 'mailnesia.com',
    'spambox.us', 'nada.email', 'nada.ltd',
    'tempr.email', 'mintemail.com', 'meltmail.com',
    'getnada.com', 'mohmal.com', 'inboxbear.com',
    'emailondeck.com', 'mytemp.email', 'tmpmail.org',
    'tmpeml.com', 'tmpbox.net', 'mailcatch.com',
    'discard.email', 'discardmail.com', 'discardmail.de'
  ];
begin
  -- Email may be null on some flows (phone-only signup); skip if so.
  if NEW.email is null or NEW.email = '' then
    return NEW;
  end if;

  v_domain := lower(split_part(NEW.email, '@', 2));
  if v_domain is null or v_domain = '' then
    raise exception 'Invalid email address';
  end if;

  if v_domain = any(v_disposable) then
    raise exception 'Disposable email addresses are not allowed. Please use a permanent email.'
      using errcode = 'check_violation';
  end if;

  -- Provider lives in raw_app_meta_data.provider for Supabase auth rows.
  -- 'email' for email/password signups; 'google', 'github', etc. for OAuth.
  v_provider := coalesce(NEW.raw_app_meta_data->>'provider', 'email');

  if v_provider = 'email' then
    if not coalesce((NEW.raw_user_meta_data->>'age_confirmed')::boolean, false) then
      raise exception 'You must confirm you are 18 or older to create an account.'
        using errcode = 'check_violation';
    end if;
    if not coalesce((NEW.raw_user_meta_data->>'terms_accepted')::boolean, false) then
      raise exception 'You must accept the Terms of Service and Privacy Policy.'
        using errcode = 'check_violation';
    end if;
  end if;

  return NEW;
end;
$$;

drop trigger if exists validate_user_signup_trigger on auth.users;

create trigger validate_user_signup_trigger
  before insert on auth.users
  for each row
  execute function public.validate_user_signup();
