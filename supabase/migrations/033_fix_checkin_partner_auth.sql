-- ============================================================
-- Migration 033: Allow partner role to complete date via check-in
-- ============================================================
-- complete_date_atomic was guarded by auth.uid() = p_user_id.
-- p_user_id is always the owner's profile ID (the shared couple
-- profile). When the partner is the second to check in, their
-- auth.uid() differs from p_user_id → RPC threw 'Unauthorized'
-- → date never completed.
--
-- Fix: expand the auth check to also accept the accepted partner
-- of p_user_id. Still rejects any unrelated caller.

create or replace function public.complete_date_atomic(p_user_id uuid, p_xp_gain integer)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_idea_id   uuid;
  v_plan      text;
  v_new_xp    integer;
  v_new_count integer;
  v_gated     boolean;
  v_caller    uuid;
begin
  v_caller := (select auth.uid());

  -- Allow the owner themselves, or their accepted partner.
  if v_caller is distinct from p_user_id
     and not exists (
       select 1
       from   public.couple_members
       where  profile_id = p_user_id
         and  user_id    = v_caller
         and  role       = 'partner'
     )
  then
    raise exception 'Unauthorized';
  end if;

  select id into v_idea_id
  from public.date_ideas
  where user_id = p_user_id
    and status  = 'revealed'
  order by revealed_at desc
  limit 1
  for update;

  if v_idea_id is null then
    raise exception 'No active revealed date found';
  end if;

  update public.date_ideas
    set status = 'completed'
  where id = v_idea_id;

  select plan_type into v_plan
  from public.profiles
  where id = p_user_id
  for update;

  v_gated := coalesce(v_plan, 'free') <> 'subscription';

  if v_gated then
    select total_xp, dates_completed_count
      into v_new_xp, v_new_count
    from public.profiles
    where id = p_user_id;
  else
    update public.profiles
      set total_xp              = total_xp + p_xp_gain,
          dates_completed_count = dates_completed_count + 1
    where id = p_user_id
    returning total_xp, dates_completed_count
      into v_new_xp, v_new_count;
  end if;

  return jsonb_build_object(
    'total_xp',              v_new_xp,
    'dates_completed_count', v_new_count,
    'gated',                 v_gated,
    'completed_idea_id',     v_idea_id
  );
end;
$$;
