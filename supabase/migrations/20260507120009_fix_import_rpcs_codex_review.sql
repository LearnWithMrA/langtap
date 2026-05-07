-- ---------------------------------------------------------
-- Migration: 20260507120009_fix_import_rpcs_codex_review.sql
-- Purpose: Codex staff-engineer review fixes for import RPCs.
--   1. Clamp scores in numeric space before casting to integer
--      to prevent integer-out-of-range on extreme values.
--   2. Add per-array count caps before the lock to bound lock
--      hold time (500 mastery, 9000 word mastery, 500 kana
--      unlocks, 9000 word unlocks).
--   3. Deduplicate IDs in each loop to avoid redundant catalog
--      probes and INSERT attempts while holding the lock.
--   4. Drop rows with non-JSON-number score fields instead of
--      coercing to zero. Malformed rows count toward
--      dropped_count and the abuse ratio. Only JSON numbers
--      are accepted, then floored and clamped.
-- ---------------------------------------------------------


-- ══════════════════════════════════════════════
-- import_guest_progress (fixed)
-- ══════════════════════════════════════════════

create or replace function public.import_guest_progress(p_payload jsonb)
returns jsonb
language plpgsql
security definer set search_path = public, pg_temp
as $$
declare
  v_user_id uuid;
  v_imported_at timestamptz;
  v_skipped_at timestamptz;

  v_mastery_arr jsonb;
  v_word_mastery_arr jsonb;
  v_manual_unlocks_arr jsonb;
  v_word_manual_unlocks_arr jsonb;

  v_total_ids integer := 0;
  v_invalid_ids integer := 0;

  v_imported_mastery integer := 0;
  v_imported_word_mastery integer := 0;
  v_imported_unlock integer := 0;
  v_imported_word_unlock integer := 0;
  v_dropped_count integer := 0;
  v_clamped_count integer := 0;

  v_row jsonb;
  v_char_id text;
  v_word_id text;
  v_score integer;
  v_learning integer;
  v_raw_score numeric;
  v_raw_learning numeric;
  v_clamped_score numeric;
  v_clamped_learning numeric;
  v_id text;

  v_seen_char_ids text[] := '{}';
  v_seen_word_ids text[] := '{}';
  v_seen_unlock_ids text[] := '{}';
  v_seen_word_unlock_ids text[] := '{}';
begin
  v_user_id := auth.uid();

  if not is_permanent_user() then
    return jsonb_build_object('status', 'error', 'message', 'Anonymous users cannot import');
  end if;

  -- ── Cheap validation (before lock) ──────────

  if p_payload is null or jsonb_typeof(p_payload) != 'object' then
    return jsonb_build_object('status', 'rejected_malformed', 'message', 'Payload must be a JSON object');
  end if;

  if octet_length(p_payload::text) > 512000 then
    return jsonb_build_object('status', 'rejected_malformed', 'message', 'Payload exceeds 500KB');
  end if;

  v_mastery_arr := coalesce(p_payload->'mastery', '[]'::jsonb);
  v_word_mastery_arr := coalesce(p_payload->'word_mastery', '[]'::jsonb);
  v_manual_unlocks_arr := coalesce(p_payload->'manual_unlocks', '[]'::jsonb);
  v_word_manual_unlocks_arr := coalesce(p_payload->'word_manual_unlocks', '[]'::jsonb);

  if jsonb_typeof(v_mastery_arr) != 'array'
     or jsonb_typeof(v_word_mastery_arr) != 'array'
     or jsonb_typeof(v_manual_unlocks_arr) != 'array'
     or jsonb_typeof(v_word_manual_unlocks_arr) != 'array' then
    return jsonb_build_object('status', 'rejected_malformed', 'message', 'All payload fields must be arrays');
  end if;

  -- Array count caps (reject before lock to bound lock hold time)
  if jsonb_array_length(v_mastery_arr) > 500 then
    return jsonb_build_object('status', 'rejected_malformed', 'message', 'mastery array exceeds 500 rows');
  end if;
  if jsonb_array_length(v_word_mastery_arr) > 9000 then
    return jsonb_build_object('status', 'rejected_malformed', 'message', 'word_mastery array exceeds 9000 rows');
  end if;
  if jsonb_array_length(v_manual_unlocks_arr) > 500 then
    return jsonb_build_object('status', 'rejected_malformed', 'message', 'manual_unlocks array exceeds 500 IDs');
  end if;
  if jsonb_array_length(v_word_manual_unlocks_arr) > 9000 then
    return jsonb_build_object('status', 'rejected_malformed', 'message', 'word_manual_unlocks array exceeds 9000 IDs');
  end if;

  -- ── Lock profiles row ──────────────────────

  select guest_imported_at, guest_import_skipped_at
    into v_imported_at, v_skipped_at
    from profiles where id = v_user_id for update;
  if not found then
    raise exception 'Profile not found' using errcode = 'P0002';
  end if;

  if v_imported_at is not null then
    return jsonb_build_object('status', 'rejected_duplicate', 'message', 'Guest progress already imported');
  end if;
  if v_skipped_at is not null then
    return jsonb_build_object('status', 'rejected_duplicate', 'message', 'Guest import was skipped');
  end if;

  -- ── Process mastery rows ───────────────────

  for v_row in select * from jsonb_array_elements(v_mastery_arr) loop
    v_char_id := v_row->>'character_id';
    v_total_ids := v_total_ids + 1;

    if v_char_id is null then
      v_invalid_ids := v_invalid_ids + 1;
      continue;
    end if;

    -- Deduplicate: skip if already processed
    if v_char_id = any(v_seen_char_ids) then
      continue;
    end if;
    v_seen_char_ids := array_append(v_seen_char_ids, v_char_id);

    if not exists (select 1 from kana_character_catalog where character_id = v_char_id) then
      v_invalid_ids := v_invalid_ids + 1;
      v_dropped_count := v_dropped_count + 1;
      continue;
    end if;

    -- Score fields must be JSON numbers. Drop rows with missing,
    -- null, string, boolean, or object score fields.
    if jsonb_typeof(v_row->'score') != 'number'
       or jsonb_typeof(v_row->'learning_score') != 'number' then
      v_invalid_ids := v_invalid_ids + 1;
      v_dropped_count := v_dropped_count + 1;
      continue;
    end if;

    -- Extract as numeric (safe: jsonb_typeof confirmed 'number')
    v_raw_score := (v_row->>'score')::numeric;
    v_raw_learning := (v_row->>'learning_score')::numeric;

    -- Clamp in numeric space before casting to integer
    v_clamped_score := least(greatest(floor(v_raw_score), 0), 1000);
    v_clamped_learning := least(greatest(floor(v_raw_learning), 0), 5);

    if v_clamped_score != floor(v_raw_score) then
      v_clamped_count := v_clamped_count + 1;
    end if;
    if v_clamped_learning != floor(v_raw_learning) then
      v_clamped_count := v_clamped_count + 1;
    end if;

    -- Safe to cast: value is in [0, 1000] / [0, 5]
    v_score := v_clamped_score::integer;
    v_learning := v_clamped_learning::integer;

    insert into mastery (user_id, character_id, score, learning_score)
      values (v_user_id, v_char_id, v_score, v_learning)
      on conflict (user_id, character_id) do update set
        score = greatest(mastery.score, excluded.score),
        learning_score = greatest(mastery.learning_score, excluded.learning_score);

    v_imported_mastery := v_imported_mastery + 1;
  end loop;

  -- ── Process word mastery rows ──────────────

  for v_row in select * from jsonb_array_elements(v_word_mastery_arr) loop
    v_word_id := v_row->>'word_id';
    v_total_ids := v_total_ids + 1;

    if v_word_id is null then
      v_invalid_ids := v_invalid_ids + 1;
      continue;
    end if;

    if v_word_id = any(v_seen_word_ids) then
      continue;
    end if;
    v_seen_word_ids := array_append(v_seen_word_ids, v_word_id);

    if not exists (select 1 from leaderboard_word_catalog where word_id = v_word_id) then
      v_invalid_ids := v_invalid_ids + 1;
      v_dropped_count := v_dropped_count + 1;
      continue;
    end if;

    if jsonb_typeof(v_row->'score') != 'number' then
      v_invalid_ids := v_invalid_ids + 1;
      v_dropped_count := v_dropped_count + 1;
      continue;
    end if;

    v_raw_score := (v_row->>'score')::numeric;
    v_clamped_score := least(greatest(floor(v_raw_score), 0), 1000);

    if v_clamped_score != floor(v_raw_score) then
      v_clamped_count := v_clamped_count + 1;
    end if;

    v_score := v_clamped_score::integer;

    insert into word_mastery (user_id, word_id, score)
      values (v_user_id, v_word_id, v_score)
      on conflict (user_id, word_id) do update set
        score = greatest(word_mastery.score, excluded.score);

    v_imported_word_mastery := v_imported_word_mastery + 1;
  end loop;

  -- ── Process manual unlocks (kana) ──────────

  for v_row in select * from jsonb_array_elements(v_manual_unlocks_arr) loop
    v_id := v_row #>> '{}';
    v_total_ids := v_total_ids + 1;

    if v_id is null then
      v_invalid_ids := v_invalid_ids + 1;
      continue;
    end if;

    if v_id = any(v_seen_unlock_ids) then
      continue;
    end if;
    v_seen_unlock_ids := array_append(v_seen_unlock_ids, v_id);

    if not exists (select 1 from kana_character_catalog where character_id = v_id) then
      v_invalid_ids := v_invalid_ids + 1;
      v_dropped_count := v_dropped_count + 1;
      continue;
    end if;

    insert into manual_unlocks (user_id, character_id)
      values (v_user_id, v_id)
      on conflict do nothing;

    v_imported_unlock := v_imported_unlock + 1;
  end loop;

  -- ── Process word manual unlocks ────────────

  for v_row in select * from jsonb_array_elements(v_word_manual_unlocks_arr) loop
    v_id := v_row #>> '{}';
    v_total_ids := v_total_ids + 1;

    if v_id is null then
      v_invalid_ids := v_invalid_ids + 1;
      continue;
    end if;

    if v_id = any(v_seen_word_unlock_ids) then
      continue;
    end if;
    v_seen_word_unlock_ids := array_append(v_seen_word_unlock_ids, v_id);

    if not exists (select 1 from leaderboard_word_catalog where word_id = v_id) then
      v_invalid_ids := v_invalid_ids + 1;
      v_dropped_count := v_dropped_count + 1;
      continue;
    end if;

    insert into word_manual_unlocks (user_id, word_id)
      values (v_user_id, v_id)
      on conflict do nothing;

    v_imported_word_unlock := v_imported_word_unlock + 1;
  end loop;

  -- ── Abuse detection ────────────────────────

  if v_total_ids > 0 and v_invalid_ids::numeric / v_total_ids::numeric > 0.5 then
    raise exception 'abuse_detected'
      using errcode = 'P0005';
  end if;

  -- ── Mark import complete ───────────────────

  update profiles
    set guest_imported_at = now()
    where id = v_user_id;

  return jsonb_build_object(
    'status', 'success',
    'imported_mastery_count', v_imported_mastery,
    'imported_word_mastery_count', v_imported_word_mastery,
    'imported_unlock_count', v_imported_unlock + v_imported_word_unlock,
    'dropped_count', v_dropped_count,
    'clamped_count', v_clamped_count
  );

exception
  when sqlstate 'P0005' then
    return jsonb_build_object('status', 'rejected_abuse', 'message', 'Too many invalid IDs');
end;
$$;


-- ══════════════════════════════════════════════
-- import_legacy_progress (fixed)
-- ══════════════════════════════════════════════

create or replace function public.import_legacy_progress(p_payload jsonb)
returns jsonb
language plpgsql
security definer set search_path = public, pg_temp
as $$
declare
  v_user_id uuid;
  v_imported_at timestamptz;
  v_skipped_at timestamptz;

  v_mastery_arr jsonb;
  v_word_mastery_arr jsonb;
  v_manual_unlocks_arr jsonb;
  v_word_manual_unlocks_arr jsonb;

  v_total_ids integer := 0;
  v_invalid_ids integer := 0;

  v_imported_mastery integer := 0;
  v_imported_word_mastery integer := 0;
  v_imported_unlock integer := 0;
  v_imported_word_unlock integer := 0;
  v_dropped_count integer := 0;
  v_clamped_count integer := 0;

  v_row jsonb;
  v_char_id text;
  v_word_id text;
  v_score integer;
  v_learning integer;
  v_raw_score numeric;
  v_raw_learning numeric;
  v_clamped_score numeric;
  v_clamped_learning numeric;
  v_id text;

  v_seen_char_ids text[] := '{}';
  v_seen_word_ids text[] := '{}';
  v_seen_unlock_ids text[] := '{}';
  v_seen_word_unlock_ids text[] := '{}';
begin
  v_user_id := auth.uid();

  if not is_permanent_user() then
    return jsonb_build_object('status', 'error', 'message', 'Anonymous users cannot import');
  end if;

  -- ── Cheap validation (before lock) ──────────

  if p_payload is null or jsonb_typeof(p_payload) != 'object' then
    return jsonb_build_object('status', 'rejected_malformed', 'message', 'Payload must be a JSON object');
  end if;

  if octet_length(p_payload::text) > 512000 then
    return jsonb_build_object('status', 'rejected_malformed', 'message', 'Payload exceeds 500KB');
  end if;

  v_mastery_arr := coalesce(p_payload->'mastery', '[]'::jsonb);
  v_word_mastery_arr := coalesce(p_payload->'word_mastery', '[]'::jsonb);
  v_manual_unlocks_arr := coalesce(p_payload->'manual_unlocks', '[]'::jsonb);
  v_word_manual_unlocks_arr := coalesce(p_payload->'word_manual_unlocks', '[]'::jsonb);

  if jsonb_typeof(v_mastery_arr) != 'array'
     or jsonb_typeof(v_word_mastery_arr) != 'array'
     or jsonb_typeof(v_manual_unlocks_arr) != 'array'
     or jsonb_typeof(v_word_manual_unlocks_arr) != 'array' then
    return jsonb_build_object('status', 'rejected_malformed', 'message', 'All payload fields must be arrays');
  end if;

  if jsonb_array_length(v_mastery_arr) > 500 then
    return jsonb_build_object('status', 'rejected_malformed', 'message', 'mastery array exceeds 500 rows');
  end if;
  if jsonb_array_length(v_word_mastery_arr) > 9000 then
    return jsonb_build_object('status', 'rejected_malformed', 'message', 'word_mastery array exceeds 9000 rows');
  end if;
  if jsonb_array_length(v_manual_unlocks_arr) > 500 then
    return jsonb_build_object('status', 'rejected_malformed', 'message', 'manual_unlocks array exceeds 500 IDs');
  end if;
  if jsonb_array_length(v_word_manual_unlocks_arr) > 9000 then
    return jsonb_build_object('status', 'rejected_malformed', 'message', 'word_manual_unlocks array exceeds 9000 IDs');
  end if;

  -- ── Lock profiles row ──────────────────────

  select legacy_imported_at, legacy_import_skipped_at
    into v_imported_at, v_skipped_at
    from profiles where id = v_user_id for update;
  if not found then
    raise exception 'Profile not found' using errcode = 'P0002';
  end if;

  if v_imported_at is not null then
    return jsonb_build_object('status', 'rejected_duplicate', 'message', 'Legacy progress already imported');
  end if;
  if v_skipped_at is not null then
    return jsonb_build_object('status', 'rejected_duplicate', 'message', 'Legacy import was skipped');
  end if;

  -- ── Process mastery rows ───────────────────

  for v_row in select * from jsonb_array_elements(v_mastery_arr) loop
    v_char_id := v_row->>'character_id';
    v_total_ids := v_total_ids + 1;

    if v_char_id is null then
      v_invalid_ids := v_invalid_ids + 1;
      continue;
    end if;

    if v_char_id = any(v_seen_char_ids) then
      continue;
    end if;
    v_seen_char_ids := array_append(v_seen_char_ids, v_char_id);

    if not exists (select 1 from kana_character_catalog where character_id = v_char_id) then
      v_invalid_ids := v_invalid_ids + 1;
      v_dropped_count := v_dropped_count + 1;
      continue;
    end if;

    if jsonb_typeof(v_row->'score') != 'number'
       or jsonb_typeof(v_row->'learning_score') != 'number' then
      v_invalid_ids := v_invalid_ids + 1;
      v_dropped_count := v_dropped_count + 1;
      continue;
    end if;

    v_raw_score := (v_row->>'score')::numeric;
    v_raw_learning := (v_row->>'learning_score')::numeric;

    v_clamped_score := least(greatest(floor(v_raw_score), 0), 1000);
    v_clamped_learning := least(greatest(floor(v_raw_learning), 0), 5);

    if v_clamped_score != floor(v_raw_score) then
      v_clamped_count := v_clamped_count + 1;
    end if;
    if v_clamped_learning != floor(v_raw_learning) then
      v_clamped_count := v_clamped_count + 1;
    end if;

    v_score := v_clamped_score::integer;
    v_learning := v_clamped_learning::integer;

    insert into mastery (user_id, character_id, score, learning_score)
      values (v_user_id, v_char_id, v_score, v_learning)
      on conflict (user_id, character_id) do update set
        score = greatest(mastery.score, excluded.score),
        learning_score = greatest(mastery.learning_score, excluded.learning_score);

    v_imported_mastery := v_imported_mastery + 1;
  end loop;

  -- ── Process word mastery rows ──────────────

  for v_row in select * from jsonb_array_elements(v_word_mastery_arr) loop
    v_word_id := v_row->>'word_id';
    v_total_ids := v_total_ids + 1;

    if v_word_id is null then
      v_invalid_ids := v_invalid_ids + 1;
      continue;
    end if;

    if v_word_id = any(v_seen_word_ids) then
      continue;
    end if;
    v_seen_word_ids := array_append(v_seen_word_ids, v_word_id);

    if not exists (select 1 from leaderboard_word_catalog where word_id = v_word_id) then
      v_invalid_ids := v_invalid_ids + 1;
      v_dropped_count := v_dropped_count + 1;
      continue;
    end if;

    if jsonb_typeof(v_row->'score') != 'number' then
      v_invalid_ids := v_invalid_ids + 1;
      v_dropped_count := v_dropped_count + 1;
      continue;
    end if;

    v_raw_score := (v_row->>'score')::numeric;
    v_clamped_score := least(greatest(floor(v_raw_score), 0), 1000);

    if v_clamped_score != floor(v_raw_score) then
      v_clamped_count := v_clamped_count + 1;
    end if;

    v_score := v_clamped_score::integer;

    insert into word_mastery (user_id, word_id, score)
      values (v_user_id, v_word_id, v_score)
      on conflict (user_id, word_id) do update set
        score = greatest(word_mastery.score, excluded.score);

    v_imported_word_mastery := v_imported_word_mastery + 1;
  end loop;

  -- ── Process manual unlocks (kana) ──────────

  for v_row in select * from jsonb_array_elements(v_manual_unlocks_arr) loop
    v_id := v_row #>> '{}';
    v_total_ids := v_total_ids + 1;

    if v_id is null then
      v_invalid_ids := v_invalid_ids + 1;
      continue;
    end if;

    if v_id = any(v_seen_unlock_ids) then
      continue;
    end if;
    v_seen_unlock_ids := array_append(v_seen_unlock_ids, v_id);

    if not exists (select 1 from kana_character_catalog where character_id = v_id) then
      v_invalid_ids := v_invalid_ids + 1;
      v_dropped_count := v_dropped_count + 1;
      continue;
    end if;

    insert into manual_unlocks (user_id, character_id)
      values (v_user_id, v_id)
      on conflict do nothing;

    v_imported_unlock := v_imported_unlock + 1;
  end loop;

  -- ── Process word manual unlocks ────────────

  for v_row in select * from jsonb_array_elements(v_word_manual_unlocks_arr) loop
    v_id := v_row #>> '{}';
    v_total_ids := v_total_ids + 1;

    if v_id is null then
      v_invalid_ids := v_invalid_ids + 1;
      continue;
    end if;

    if v_id = any(v_seen_word_unlock_ids) then
      continue;
    end if;
    v_seen_word_unlock_ids := array_append(v_seen_word_unlock_ids, v_id);

    if not exists (select 1 from leaderboard_word_catalog where word_id = v_id) then
      v_invalid_ids := v_invalid_ids + 1;
      v_dropped_count := v_dropped_count + 1;
      continue;
    end if;

    insert into word_manual_unlocks (user_id, word_id)
      values (v_user_id, v_id)
      on conflict do nothing;

    v_imported_word_unlock := v_imported_word_unlock + 1;
  end loop;

  -- ── Abuse detection ────────────────────────

  if v_total_ids > 0 and v_invalid_ids::numeric / v_total_ids::numeric > 0.5 then
    raise exception 'abuse_detected'
      using errcode = 'P0005';
  end if;

  -- ── Mark import complete ───────────────────

  update profiles
    set guest_imported_at = now()
    where id = v_user_id;

  return jsonb_build_object(
    'status', 'success',
    'imported_mastery_count', v_imported_mastery,
    'imported_word_mastery_count', v_imported_word_mastery,
    'imported_unlock_count', v_imported_unlock + v_imported_word_unlock,
    'dropped_count', v_dropped_count,
    'clamped_count', v_clamped_count
  );

exception
  when sqlstate 'P0005' then
    return jsonb_build_object('status', 'rejected_abuse', 'message', 'Too many invalid IDs');
end;
$$;


-- ══════════════════════════════════════════════
-- import_legacy_progress (fixed)
-- ══════════════════════════════════════════════

create or replace function public.import_legacy_progress(p_payload jsonb)
returns jsonb
language plpgsql
security definer set search_path = public, pg_temp
as $$
declare
  v_user_id uuid;
  v_imported_at timestamptz;
  v_skipped_at timestamptz;

  v_mastery_arr jsonb;
  v_word_mastery_arr jsonb;
  v_manual_unlocks_arr jsonb;
  v_word_manual_unlocks_arr jsonb;

  v_total_ids integer := 0;
  v_invalid_ids integer := 0;

  v_imported_mastery integer := 0;
  v_imported_word_mastery integer := 0;
  v_imported_unlock integer := 0;
  v_imported_word_unlock integer := 0;
  v_dropped_count integer := 0;
  v_clamped_count integer := 0;

  v_row jsonb;
  v_char_id text;
  v_word_id text;
  v_score integer;
  v_learning integer;
  v_raw_score numeric;
  v_raw_learning numeric;
  v_clamped_score numeric;
  v_clamped_learning numeric;
  v_id text;

  v_seen_char_ids text[] := '{}';
  v_seen_word_ids text[] := '{}';
  v_seen_unlock_ids text[] := '{}';
  v_seen_word_unlock_ids text[] := '{}';
begin
  v_user_id := auth.uid();

  if not is_permanent_user() then
    return jsonb_build_object('status', 'error', 'message', 'Anonymous users cannot import');
  end if;

  -- ── Cheap validation (before lock) ──────────

  if p_payload is null or jsonb_typeof(p_payload) != 'object' then
    return jsonb_build_object('status', 'rejected_malformed', 'message', 'Payload must be a JSON object');
  end if;

  if octet_length(p_payload::text) > 512000 then
    return jsonb_build_object('status', 'rejected_malformed', 'message', 'Payload exceeds 500KB');
  end if;

  v_mastery_arr := coalesce(p_payload->'mastery', '[]'::jsonb);
  v_word_mastery_arr := coalesce(p_payload->'word_mastery', '[]'::jsonb);
  v_manual_unlocks_arr := coalesce(p_payload->'manual_unlocks', '[]'::jsonb);
  v_word_manual_unlocks_arr := coalesce(p_payload->'word_manual_unlocks', '[]'::jsonb);

  if jsonb_typeof(v_mastery_arr) != 'array'
     or jsonb_typeof(v_word_mastery_arr) != 'array'
     or jsonb_typeof(v_manual_unlocks_arr) != 'array'
     or jsonb_typeof(v_word_manual_unlocks_arr) != 'array' then
    return jsonb_build_object('status', 'rejected_malformed', 'message', 'All payload fields must be arrays');
  end if;

  if jsonb_array_length(v_mastery_arr) > 500 then
    return jsonb_build_object('status', 'rejected_malformed', 'message', 'mastery array exceeds 500 rows');
  end if;
  if jsonb_array_length(v_word_mastery_arr) > 9000 then
    return jsonb_build_object('status', 'rejected_malformed', 'message', 'word_mastery array exceeds 9000 rows');
  end if;
  if jsonb_array_length(v_manual_unlocks_arr) > 500 then
    return jsonb_build_object('status', 'rejected_malformed', 'message', 'manual_unlocks array exceeds 500 IDs');
  end if;
  if jsonb_array_length(v_word_manual_unlocks_arr) > 9000 then
    return jsonb_build_object('status', 'rejected_malformed', 'message', 'word_manual_unlocks array exceeds 9000 IDs');
  end if;

  -- ── Lock profiles row ──────────────────────

  select legacy_imported_at, legacy_import_skipped_at
    into v_imported_at, v_skipped_at
    from profiles where id = v_user_id for update;
  if not found then
    raise exception 'Profile not found' using errcode = 'P0002';
  end if;

  if v_imported_at is not null then
    return jsonb_build_object('status', 'rejected_duplicate', 'message', 'Legacy progress already imported');
  end if;
  if v_skipped_at is not null then
    return jsonb_build_object('status', 'rejected_duplicate', 'message', 'Legacy import was skipped');
  end if;

  -- ── Process mastery rows ───────────────────

  for v_row in select * from jsonb_array_elements(v_mastery_arr) loop
    v_char_id := v_row->>'character_id';
    v_total_ids := v_total_ids + 1;

    if v_char_id is null then
      v_invalid_ids := v_invalid_ids + 1;
      continue;
    end if;

    if v_char_id = any(v_seen_char_ids) then
      continue;
    end if;
    v_seen_char_ids := array_append(v_seen_char_ids, v_char_id);

    if not exists (select 1 from kana_character_catalog where character_id = v_char_id) then
      v_invalid_ids := v_invalid_ids + 1;
      v_dropped_count := v_dropped_count + 1;
      continue;
    end if;

    if jsonb_typeof(v_row->'score') != 'number'
       or jsonb_typeof(v_row->'learning_score') != 'number' then
      v_invalid_ids := v_invalid_ids + 1;
      v_dropped_count := v_dropped_count + 1;
      continue;
    end if;

    v_raw_score := (v_row->>'score')::numeric;
    v_raw_learning := (v_row->>'learning_score')::numeric;

    v_clamped_score := least(greatest(floor(v_raw_score), 0), 1000);
    v_clamped_learning := least(greatest(floor(v_raw_learning), 0), 5);

    if v_clamped_score != floor(v_raw_score) then
      v_clamped_count := v_clamped_count + 1;
    end if;
    if v_clamped_learning != floor(v_raw_learning) then
      v_clamped_count := v_clamped_count + 1;
    end if;

    v_score := v_clamped_score::integer;
    v_learning := v_clamped_learning::integer;

    insert into mastery (user_id, character_id, score, learning_score)
      values (v_user_id, v_char_id, v_score, v_learning)
      on conflict (user_id, character_id) do update set
        score = greatest(mastery.score, excluded.score),
        learning_score = greatest(mastery.learning_score, excluded.learning_score);

    v_imported_mastery := v_imported_mastery + 1;
  end loop;

  -- ── Process word mastery rows ──────────────

  for v_row in select * from jsonb_array_elements(v_word_mastery_arr) loop
    v_word_id := v_row->>'word_id';
    v_total_ids := v_total_ids + 1;

    if v_word_id is null then
      v_invalid_ids := v_invalid_ids + 1;
      continue;
    end if;

    if v_word_id = any(v_seen_word_ids) then
      continue;
    end if;
    v_seen_word_ids := array_append(v_seen_word_ids, v_word_id);

    if not exists (select 1 from leaderboard_word_catalog where word_id = v_word_id) then
      v_invalid_ids := v_invalid_ids + 1;
      v_dropped_count := v_dropped_count + 1;
      continue;
    end if;

    if jsonb_typeof(v_row->'score') != 'number' then
      v_invalid_ids := v_invalid_ids + 1;
      v_dropped_count := v_dropped_count + 1;
      continue;
    end if;

    v_raw_score := (v_row->>'score')::numeric;
    v_clamped_score := least(greatest(floor(v_raw_score), 0), 1000);

    if v_clamped_score != floor(v_raw_score) then
      v_clamped_count := v_clamped_count + 1;
    end if;

    v_score := v_clamped_score::integer;

    insert into word_mastery (user_id, word_id, score)
      values (v_user_id, v_word_id, v_score)
      on conflict (user_id, word_id) do update set
        score = greatest(word_mastery.score, excluded.score);

    v_imported_word_mastery := v_imported_word_mastery + 1;
  end loop;

  -- ── Process manual unlocks (kana) ──────────

  for v_row in select * from jsonb_array_elements(v_manual_unlocks_arr) loop
    v_id := v_row #>> '{}';
    v_total_ids := v_total_ids + 1;

    if v_id is null then
      v_invalid_ids := v_invalid_ids + 1;
      continue;
    end if;

    if v_id = any(v_seen_unlock_ids) then
      continue;
    end if;
    v_seen_unlock_ids := array_append(v_seen_unlock_ids, v_id);

    if not exists (select 1 from kana_character_catalog where character_id = v_id) then
      v_invalid_ids := v_invalid_ids + 1;
      v_dropped_count := v_dropped_count + 1;
      continue;
    end if;

    insert into manual_unlocks (user_id, character_id)
      values (v_user_id, v_id)
      on conflict do nothing;

    v_imported_unlock := v_imported_unlock + 1;
  end loop;

  -- ── Process word manual unlocks ────────────

  for v_row in select * from jsonb_array_elements(v_word_manual_unlocks_arr) loop
    v_id := v_row #>> '{}';
    v_total_ids := v_total_ids + 1;

    if v_id is null then
      v_invalid_ids := v_invalid_ids + 1;
      continue;
    end if;

    if v_id = any(v_seen_word_unlock_ids) then
      continue;
    end if;
    v_seen_word_unlock_ids := array_append(v_seen_word_unlock_ids, v_id);

    if not exists (select 1 from leaderboard_word_catalog where word_id = v_id) then
      v_invalid_ids := v_invalid_ids + 1;
      v_dropped_count := v_dropped_count + 1;
      continue;
    end if;

    insert into word_manual_unlocks (user_id, word_id)
      values (v_user_id, v_id)
      on conflict do nothing;

    v_imported_word_unlock := v_imported_word_unlock + 1;
  end loop;

  -- ── Abuse detection ────────────────────────

  if v_total_ids > 0 and v_invalid_ids::numeric / v_total_ids::numeric > 0.5 then
    raise exception 'abuse_detected'
      using errcode = 'P0005';
  end if;

  -- ── Mark import complete ───────────────────

  update profiles
    set legacy_imported_at = now()
    where id = v_user_id;

  return jsonb_build_object(
    'status', 'success',
    'imported_mastery_count', v_imported_mastery,
    'imported_word_mastery_count', v_imported_word_mastery,
    'imported_unlock_count', v_imported_unlock + v_imported_word_unlock,
    'dropped_count', v_dropped_count,
    'clamped_count', v_clamped_count
  );

exception
  when sqlstate 'P0005' then
    return jsonb_build_object('status', 'rejected_abuse', 'message', 'Too many invalid IDs');
end;
$$;
