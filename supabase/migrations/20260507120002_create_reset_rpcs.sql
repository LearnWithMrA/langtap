-- ---------------------------------------------------------
-- Migration: 20260507120002_create_reset_rpcs.sql
-- Purpose: Sprint 10 Phase 0d.
--   Create four reset RPCs with profile row lock serialization,
--   domain epoch increment, and unlock cleanup. All RPCs are
--   security definer and reject anonymous users.
--   The profile row lock serializes resets against concurrent
--   checkpoint sync RPCs (Plan 0g) using the same row.
-- ---------------------------------------------------------


-- ══════════════════════════════════════════════
-- reset_character_mastery: reset a single kana character
-- ══════════════════════════════════════════════

create or replace function public.reset_character_mastery(p_character_id text)
returns jsonb
language plpgsql
security definer set search_path = public, pg_temp
as $$
declare
  v_user_id uuid;
  v_epoch integer;
begin
  v_user_id := auth.uid();

  if not is_permanent_user() then
    raise exception 'Anonymous users cannot reset mastery'
      using errcode = 'P0001';
  end if;

  select mastery_reset_epoch into v_epoch
    from profiles where id = v_user_id for update;
  if not found then
    raise exception 'Profile not found' using errcode = 'P0002';
  end if;

  v_epoch := v_epoch + 1;

  update profiles
    set mastery_reset_epoch = v_epoch
    where id = v_user_id;

  update mastery
    set score = 0, learning_score = 0
    where user_id = v_user_id and character_id = p_character_id;

  return jsonb_build_object('new_epoch', v_epoch);
end;
$$;

revoke execute on function public.reset_character_mastery from public;
grant execute on function public.reset_character_mastery to authenticated;


-- ══════════════════════════════════════════════
-- reset_all_mastery: reset all kana progress + delete unlocks
-- ══════════════════════════════════════════════

create or replace function public.reset_all_mastery()
returns jsonb
language plpgsql
security definer set search_path = public, pg_temp
as $$
declare
  v_user_id uuid;
  v_epoch integer;
begin
  v_user_id := auth.uid();

  if not is_permanent_user() then
    raise exception 'Anonymous users cannot reset mastery'
      using errcode = 'P0001';
  end if;

  select mastery_reset_epoch into v_epoch
    from profiles where id = v_user_id for update;
  if not found then
    raise exception 'Profile not found' using errcode = 'P0002';
  end if;

  v_epoch := v_epoch + 1;

  update profiles
    set mastery_reset_epoch = v_epoch
    where id = v_user_id;

  update mastery
    set score = 0, learning_score = 0
    where user_id = v_user_id;

  delete from manual_unlocks
    where user_id = v_user_id;

  return jsonb_build_object('new_epoch', v_epoch);
end;
$$;

revoke execute on function public.reset_all_mastery from public;
grant execute on function public.reset_all_mastery to authenticated;


-- ══════════════════════════════════════════════
-- reset_word_mastery: reset a single word + preserve unlock
-- ══════════════════════════════════════════════

create or replace function public.reset_word_mastery(p_word_id text)
returns jsonb
language plpgsql
security definer set search_path = public, pg_temp
as $$
declare
  v_user_id uuid;
  v_epoch integer;
begin
  v_user_id := auth.uid();

  if not is_permanent_user() then
    raise exception 'Anonymous users cannot reset word mastery'
      using errcode = 'P0001';
  end if;

  select word_mastery_reset_epoch into v_epoch
    from profiles where id = v_user_id for update;
  if not found then
    raise exception 'Profile not found' using errcode = 'P0002';
  end if;

  -- Validate word_id against catalog before inserting unlock row
  if not exists (
    select 1 from leaderboard_word_catalog where word_id = p_word_id
  ) then
    raise exception 'Unknown word_id: %', p_word_id
      using errcode = 'P0003';
  end if;

  v_epoch := v_epoch + 1;

  update profiles
    set word_mastery_reset_epoch = v_epoch
    where id = v_user_id;

  update word_mastery
    set score = 0
    where user_id = v_user_id and word_id = p_word_id;

  -- Preserve tile visibility after reset
  insert into word_manual_unlocks (user_id, word_id)
    values (v_user_id, p_word_id)
    on conflict do nothing;

  return jsonb_build_object('new_epoch', v_epoch);
end;
$$;

revoke execute on function public.reset_word_mastery from public;
grant execute on function public.reset_word_mastery to authenticated;


-- ══════════════════════════════════════════════
-- reset_all_word_mastery: reset all word progress + delete unlocks
-- ══════════════════════════════════════════════

create or replace function public.reset_all_word_mastery()
returns jsonb
language plpgsql
security definer set search_path = public, pg_temp
as $$
declare
  v_user_id uuid;
  v_epoch integer;
begin
  v_user_id := auth.uid();

  if not is_permanent_user() then
    raise exception 'Anonymous users cannot reset word mastery'
      using errcode = 'P0001';
  end if;

  select word_mastery_reset_epoch into v_epoch
    from profiles where id = v_user_id for update;
  if not found then
    raise exception 'Profile not found' using errcode = 'P0002';
  end if;

  v_epoch := v_epoch + 1;

  update profiles
    set word_mastery_reset_epoch = v_epoch
    where id = v_user_id;

  update word_mastery
    set score = 0
    where user_id = v_user_id;

  delete from word_manual_unlocks
    where user_id = v_user_id;

  return jsonb_build_object('new_epoch', v_epoch);
end;
$$;

revoke execute on function public.reset_all_word_mastery from public;
grant execute on function public.reset_all_word_mastery to authenticated;
