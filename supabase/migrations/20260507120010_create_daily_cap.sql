-- Migration: 20260507120010_create_daily_cap.sql
-- Purpose: Daily distance cap for free-tier users. Records per-completion
--          distance events with advisory lock serialization. Feature-flagged
--          via app_config.daily_cap_enabled (seeded in 20260507120003).
--          Cap crossing allowed; next completion blocked.

-- ── Table ─────────────────────────────────────

CREATE TABLE public.daily_cap_events (
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  completion_id uuid NOT NULL,
  metres        integer NOT NULL CHECK (metres > 0),
  local_date    date NOT NULL,
  cap_enforced  boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, completion_id)
);

ALTER TABLE public.daily_cap_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_cap_events FORCE ROW LEVEL SECURITY;

CREATE INDEX daily_cap_events_user_date
  ON public.daily_cap_events (user_id, local_date)
  WHERE cap_enforced = true;

-- RLS: no client policies. All access through RPCs (security definer).

-- ── get_daily_usage RPC ───────────────────────

CREATE OR REPLACE FUNCTION public.get_daily_usage()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid;
  v_user_tz text;
  v_local_date date;
  v_total integer;
  v_cap_enabled boolean;
  v_cap_amount integer := 100;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = 'P0001';
  END IF;

  IF NOT public.is_permanent_user() THEN
    RAISE EXCEPTION 'Anonymous users cannot use daily cap' USING ERRCODE = 'P0001';
  END IF;

  SELECT coalesce(p.user_tz, 'UTC') INTO v_user_tz
    FROM profiles p WHERE p.id = v_user_id;

  IF NOT EXISTS (SELECT 1 FROM pg_timezone_names WHERE name = v_user_tz) THEN
    v_user_tz := 'UTC';
  END IF;

  v_local_date := (now() AT TIME ZONE v_user_tz)::date;

  SELECT coalesce((value)::boolean, false) INTO v_cap_enabled
    FROM app_config WHERE key = 'daily_cap_enabled';

  SELECT coalesce(sum(metres), 0) INTO v_total
    FROM daily_cap_events
    WHERE user_id = v_user_id
      AND local_date = v_local_date
      AND cap_enforced = true;

  RETURN jsonb_build_object(
    'total_today', v_total,
    'is_capped', v_cap_enabled AND v_total >= v_cap_amount,
    'cap_amount', v_cap_amount,
    'cap_enabled', v_cap_enabled,
    'local_date', v_local_date
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_daily_usage() FROM public;
GRANT EXECUTE ON FUNCTION public.get_daily_usage() TO authenticated;

-- ── increment_daily_distance RPC ──────────────

CREATE OR REPLACE FUNCTION public.increment_daily_distance(
  p_metres integer,
  p_completion_id uuid
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
  v_total integer;
  v_cap_enabled boolean;
  v_cap_enforced boolean;
  v_cap_amount integer := 100;
  v_inserted boolean;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = 'P0001';
  END IF;

  IF NOT public.is_permanent_user() THEN
    RAISE EXCEPTION 'Anonymous users cannot use daily cap' USING ERRCODE = 'P0001';
  END IF;

  IF p_metres <= 0 OR p_metres > 500 THEN
    RAISE EXCEPTION 'metres must be between 1 and 500' USING ERRCODE = 'P0001';
  END IF;

  -- Validate timezone
  SELECT coalesce(p.user_tz, 'UTC') INTO v_user_tz
    FROM profiles p WHERE p.id = v_user_id;

  IF NOT EXISTS (SELECT 1 FROM pg_timezone_names WHERE name = v_user_tz) THEN
    v_user_tz := 'UTC';
  END IF;

  v_local_date := (now() AT TIME ZONE v_user_tz)::date;

  -- Two-int advisory lock: serializes concurrent completions for same user+date
  PERFORM pg_advisory_xact_lock(
    hashtext(v_user_id::text),
    hashtext(v_local_date::text)
  );

  -- Read feature flag
  SELECT coalesce((value)::boolean, false) INTO v_cap_enabled
    FROM app_config WHERE key = 'daily_cap_enabled';

  v_cap_enforced := v_cap_enabled;

  -- Current enforced total for today
  SELECT coalesce(sum(metres), 0) INTO v_total
    FROM daily_cap_events
    WHERE user_id = v_user_id
      AND local_date = v_local_date
      AND cap_enforced = true;

  -- If already at or above cap and enforcement is on, reject
  IF v_cap_enabled AND v_total >= v_cap_amount THEN
    RETURN jsonb_build_object(
      'total_today', v_total,
      'is_capped', true,
      'cap_amount', v_cap_amount,
      'cap_enabled', v_cap_enabled,
      'inserted', false
    );
  END IF;

  -- Idempotent insert: ON CONFLICT DO NOTHING for duplicate completion_id
  INSERT INTO daily_cap_events (user_id, completion_id, metres, local_date, cap_enforced)
  VALUES (v_user_id, p_completion_id, p_metres, v_local_date, v_cap_enforced)
  ON CONFLICT (user_id, completion_id) DO NOTHING;

  v_inserted := FOUND;

  -- Recompute total after insert
  IF v_inserted AND v_cap_enforced THEN
    v_total := v_total + p_metres;
  ELSIF NOT v_inserted THEN
    -- Duplicate: return current total without change
    NULL;
  END IF;

  RETURN jsonb_build_object(
    'total_today', v_total,
    'is_capped', v_cap_enabled AND v_total >= v_cap_amount,
    'cap_amount', v_cap_amount,
    'cap_enabled', v_cap_enabled,
    'inserted', v_inserted
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.increment_daily_distance(integer, uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.increment_daily_distance(integer, uuid) TO authenticated;
