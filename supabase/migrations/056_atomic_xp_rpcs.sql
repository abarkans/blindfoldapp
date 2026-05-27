-- ============================================================
-- Migration 056: Atomic XP increment RPCs
-- ============================================================
--
-- Fixes a read-modify-write race in check-in XP and photo XP.
-- Previously:
--   1. Server action reads total_xp from profiles
--   2. Server action computes total_xp + xp_gain in JS
--   3. Server action writes the computed value
-- If owner and partner act concurrently, one increment is lost.
--
-- record_checkin(p_profile_id, p_xp_gain)
--   Callable by authenticated users (via supabase.rpc from server action).
--   Internally resolves the caller's role via auth.uid() + couple_members.
--   Uses SELECT … FOR UPDATE to prevent the race, then atomically:
--     - Sets checkin_owner_at or checkin_partner_at (once only)
--     - Increments total_checkins and total_xp
--   Returns was_new + xp_awarded so the server action knows if XP was gained.
--
-- award_xp(p_profile_id, p_xp)
--   Service-role only (called via admin client from photo.ts server action).
--   Simple atomic total_xp += p_xp — no auth.uid() needed because the
--   server action has already verified authorization.
-- ============================================================

-- ── record_checkin ───────────────────────────────────────────────────────────

create or replace function public.record_checkin(
  p_profile_id uuid,
  p_xp_gain    integer
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_caller       uuid;
  v_role         text;
  v_was_new      boolean;
  v_new_xp       integer;
  v_new_checkins integer;
begin
  v_caller := (select auth.uid());
  if v_caller is null then
    raise exception 'Unauthorized';
  end if;

  -- Resolve caller's role in this couple
  select role into v_role
  from   public.couple_members
  where  profile_id = p_profile_id
    and  user_id    = v_caller;

  if not found then
    raise exception 'Unauthorized';
  end if;

  -- Lock the profile row to serialise concurrent check-ins
  select
    case
      when v_role = 'owner'   then checkin_owner_at   is null
      when v_role = 'partner' then checkin_partner_at is null
      else false
    end
  into v_was_new
  from public.profiles
  where id = p_profile_id
  for update;

  if not found then
    raise exception 'Profile not found';
  end if;

  if v_was_new then
    update public.profiles
      set
        checkin_owner_at   = case when v_role = 'owner'   then now() else checkin_owner_at   end,
        checkin_partner_at = case when v_role = 'partner' then now() else checkin_partner_at end,
        total_checkins     = total_checkins + 1,
        total_xp           = total_xp + p_xp_gain
    where id = p_profile_id
    returning total_xp, total_checkins into v_new_xp, v_new_checkins;
  else
    select total_xp, total_checkins
      into v_new_xp, v_new_checkins
    from public.profiles
    where id = p_profile_id;
  end if;

  return jsonb_build_object(
    'was_new',        v_was_new,
    'total_xp',       v_new_xp,
    'total_checkins', v_new_checkins,
    'xp_awarded',     case when v_was_new then p_xp_gain else 0 end
  );
end;
$$;

revoke execute on function public.record_checkin(uuid, integer) from public;
revoke execute on function public.record_checkin(uuid, integer) from anon;
grant  execute on function public.record_checkin(uuid, integer) to authenticated;

-- ── award_xp ─────────────────────────────────────────────────────────────────

create or replace function public.award_xp(
  p_profile_id uuid,
  p_xp         integer
)
returns integer     -- new total_xp
language sql
security definer
set search_path = public, pg_temp
as $$
  update public.profiles
    set total_xp = total_xp + p_xp
  where id = p_profile_id
  returning total_xp;
$$;

revoke execute on function public.award_xp(uuid, integer) from public;
revoke execute on function public.award_xp(uuid, integer) from anon;
revoke execute on function public.award_xp(uuid, integer) from authenticated;
grant  execute on function public.award_xp(uuid, integer) to service_role;
