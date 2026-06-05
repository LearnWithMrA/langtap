-- ---------------------------------------------------------
-- Migration: 20260605120002_factory_reset_add_practice_events.sql
-- Purpose: Adds practice_activity_events to the factory_reset RPC
--          DELETE scope. The new table was added in Sprint 13 but
--          factory_reset was not updated to include it.
-- ---------------------------------------------------------

CREATE OR REPLACE FUNCTION public.factory_reset()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid;
  v_mastery_epoch integer;
  v_word_mastery_epoch integer;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = 'P0001';
  END IF;

  IF NOT public.is_permanent_user() THEN
    RAISE EXCEPTION 'Anonymous users cannot perform a factory reset' USING ERRCODE = 'P0001';
  END IF;

  -- Lock the profile row to serialize against concurrent syncs/resets
  SELECT mastery_reset_epoch + 1, word_mastery_reset_epoch + 1
    INTO v_mastery_epoch, v_word_mastery_epoch
    FROM profiles WHERE id = v_user_id FOR UPDATE;

  UPDATE profiles
    SET mastery_reset_epoch = v_mastery_epoch,
        word_mastery_reset_epoch = v_word_mastery_epoch,
        tap_reminder_count = 0
    WHERE id = v_user_id;

  -- Delete all progress rows. Order does not matter (no inter-table FKs).
  DELETE FROM mastery WHERE user_id = v_user_id;
  DELETE FROM manual_unlocks WHERE user_id = v_user_id;
  DELETE FROM word_mastery WHERE user_id = v_user_id;
  DELETE FROM word_manual_unlocks WHERE user_id = v_user_id;
  DELETE FROM word_counters WHERE user_id = v_user_id;
  DELETE FROM practice_sessions WHERE user_id = v_user_id;
  DELETE FROM practice_activity_events WHERE user_id = v_user_id;
  DELETE FROM leaderboard_score_events WHERE user_id = v_user_id;
  DELETE FROM leaderboard_scores WHERE user_id = v_user_id;
  DELETE FROM leaderboard_sessions WHERE user_id = v_user_id;
  DELETE FROM leaderboard WHERE user_id = v_user_id;

  RETURN jsonb_build_object(
    'new_mastery_epoch', v_mastery_epoch,
    'new_word_mastery_epoch', v_word_mastery_epoch
  );
END;
$$;
