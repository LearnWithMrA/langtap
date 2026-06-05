-- ---------------------------------------------------------
-- Migration: 20260605120001_create_practice_activity_events.sql
-- Purpose: Sprint 13 Task 1. Practice session recording RPC.
--          1. Creates practice_activity_events table for
--             idempotency (same pattern as leaderboard_score_events).
--          2. Creates record_practice_activity RPC that reads
--             user_tz from profiles server-side, derives local_date,
--             deduplicates via events table, and upserts
--             practice_sessions.
--          3. Locks down practice_sessions RLS: removes direct
--             INSERT/UPDATE policies. All writes go through RPC.
-- ---------------------------------------------------------


-- ── practice_activity_events (idempotency) ──
-- One row per batch flush. Prevents double-counting on retry.

CREATE TABLE public.practice_activity_events (
  event_id      uuid PRIMARY KEY,
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  characters_count integer NOT NULL CHECK (characters_count > 0),
  local_date    date NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX practice_activity_events_user_idx
  ON public.practice_activity_events (user_id, created_at DESC);

ALTER TABLE public.practice_activity_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_activity_events FORCE ROW LEVEL SECURITY;

-- No policies. All access through RPC.


-- ── RLS lockdown: practice_sessions ─────────
-- Remove direct client INSERT/UPDATE. All writes through RPC only.
-- SELECT policy remains (users read their own rows for streak/heatmap).

DROP POLICY IF EXISTS "Users insert own practice sessions"
  ON public.practice_sessions;

DROP POLICY IF EXISTS "Users update own practice sessions"
  ON public.practice_sessions;

-- Sprint 10 replaced the above with permanent-user variants. Drop those too.
DROP POLICY IF EXISTS "Permanent users insert own practice sessions"
  ON public.practice_sessions;

DROP POLICY IF EXISTS "Permanent users update own practice sessions"
  ON public.practice_sessions;


-- ── RPC: record_practice_activity ───────────
-- Called per batch flush from the practice hooks.
-- Accepts a completion_id (uuid) and characters_count.
-- Reads user_tz from profiles server-side.
-- Idempotent via event_id. Rejects anonymous users.

CREATE OR REPLACE FUNCTION public.record_practice_activity(
  p_completion_id uuid,
  p_characters_count integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid;
  v_user_tz text;
  v_local_date date;
  v_new_total integer;
  v_inserted boolean;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = 'P0001';
  END IF;

  IF NOT public.is_permanent_user() THEN
    RAISE EXCEPTION 'Anonymous users cannot record practice' USING ERRCODE = 'P0001';
  END IF;

  IF p_characters_count <= 0 OR p_characters_count > 1000 THEN
    RAISE EXCEPTION 'characters_count must be between 1 and 1000' USING ERRCODE = 'P0001';
  END IF;

  -- Read user timezone from profiles
  SELECT coalesce(p.user_tz, 'UTC') INTO v_user_tz
    FROM profiles p WHERE p.id = v_user_id;

  IF NOT EXISTS (SELECT 1 FROM pg_timezone_names WHERE name = v_user_tz) THEN
    v_user_tz := 'UTC';
  END IF;

  v_local_date := (now() AT TIME ZONE v_user_tz)::date;

  -- Atomic idempotent insert: ON CONFLICT DO NOTHING avoids race conditions
  INSERT INTO practice_activity_events
    (event_id, user_id, characters_count, local_date)
  VALUES
    (p_completion_id, v_user_id, p_characters_count, v_local_date)
  ON CONFLICT (event_id) DO NOTHING;

  v_inserted := FOUND;

  -- Only upsert practice_sessions if the event was new
  IF v_inserted THEN
    INSERT INTO practice_sessions
      (user_id, event_at_utc, user_tz, local_date, characters_practiced)
    VALUES
      (v_user_id, now(), v_user_tz, v_local_date, p_characters_count)
    ON CONFLICT (user_id, local_date) DO UPDATE SET
      characters_practiced = practice_sessions.characters_practiced + p_characters_count,
      event_at_utc = now(),
      user_tz = v_user_tz;
  END IF;

  SELECT ps.characters_practiced INTO v_new_total
    FROM practice_sessions ps
    WHERE ps.user_id = v_user_id AND ps.local_date = v_local_date;

  RETURN jsonb_build_object(
    'local_date', v_local_date,
    'characters_practiced', coalesce(v_new_total, 0),
    'inserted', v_inserted
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.record_practice_activity(uuid, integer) FROM public;
GRANT EXECUTE ON FUNCTION public.record_practice_activity(uuid, integer) TO authenticated;
