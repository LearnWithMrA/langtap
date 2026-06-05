-- ---------------------------------------------------------
-- Migration: 20260605120000_create_factory_reset_rpc.sql
-- Purpose: Sprint 12 Task 2.
--   Factory reset RPC that atomically clears ALL user progress
--   in a single transaction. Increments both mastery epochs,
--   resets tap_reminder_count, deletes all progress rows.
--   Preserves: daily_cap_events, profile settings, membership.
--   Onboarding-selected unlocks live client-side (onboarding store)
--   and are intentionally preserved: factory reset returns to
--   post-onboarding state, not pre-onboarding.
--   Uses profile row lock for serialization against concurrent
--   checkpoint sync RPCs (same pattern as existing reset RPCs).
-- ---------------------------------------------------------


-- ══════════════════════════════════════════════
-- factory_reset: clear all progress, return new epochs
-- ══════════════════════════════════════════════

create or replace function public.factory_reset()
returns jsonb
language plpgsql
security definer set search_path = public, pg_temp
as $$
declare
  v_user_id uuid;
  v_mastery_epoch integer;
  v_word_mastery_epoch integer;
begin
  v_user_id := auth.uid();

  if not is_permanent_user() then
    raise exception 'Anonymous users cannot perform a factory reset'
      using errcode = 'P0001';
  end if;

  -- Serialization point: locks the profile row against concurrent
  -- checkpoint syncs and other reset RPCs.
  select mastery_reset_epoch, word_mastery_reset_epoch
    into v_mastery_epoch, v_word_mastery_epoch
    from profiles where id = v_user_id for update;

  if not found then
    raise exception 'Profile not found' using errcode = 'P0002';
  end if;

  -- Increment both epochs in one update (no double-increment).
  v_mastery_epoch := v_mastery_epoch + 1;
  v_word_mastery_epoch := v_word_mastery_epoch + 1;

  update profiles
    set mastery_reset_epoch = v_mastery_epoch,
        word_mastery_reset_epoch = v_word_mastery_epoch,
        tap_reminder_count = 0
    where id = v_user_id;

  -- Delete all progress rows. Order does not matter (no inter-table FKs).
  delete from mastery where user_id = v_user_id;
  delete from manual_unlocks where user_id = v_user_id;
  delete from word_mastery where user_id = v_user_id;
  delete from word_manual_unlocks where user_id = v_user_id;
  delete from word_counters where user_id = v_user_id;
  delete from practice_sessions where user_id = v_user_id;
  delete from leaderboard_score_events where user_id = v_user_id;
  delete from leaderboard_scores where user_id = v_user_id;
  delete from leaderboard_sessions where user_id = v_user_id;
  delete from leaderboard where user_id = v_user_id;

  return jsonb_build_object(
    'new_mastery_epoch', v_mastery_epoch,
    'new_word_mastery_epoch', v_word_mastery_epoch
  );
end;
$$;

revoke execute on function public.factory_reset from public;
grant execute on function public.factory_reset to authenticated;
