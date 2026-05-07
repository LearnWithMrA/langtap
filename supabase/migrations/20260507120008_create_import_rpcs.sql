-- ---------------------------------------------------------
-- Migration: 20260507120008_create_import_rpcs.sql
-- Purpose: Sprint 10 Phase 3, Plan 4.
--   Create import_guest_progress and import_legacy_progress
--   RPCs for safe server-validated guest-to-account import.
--   Both RPCs: cheap validation before lock, catalog ID
--   validation, abuse detection (>50% invalid), score
--   clamping, greatest-merge, one-time-per-source guard,
--   no leaderboard credit.
-- ---------------------------------------------------------


-- ══════════════════════════════════════════════
-- import_guest_progress: one-time import of current-session
-- guest localStorage data into a permanent account.
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
  v_id text;
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

  -- Extract arrays (default to empty arrays)
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

    if not exists (select 1 from kana_character_catalog where character_id = v_char_id) then
      v_invalid_ids := v_invalid_ids + 1;
      v_dropped_count := v_dropped_count + 1;
      continue;
    end if;

    -- Parse and clamp score
    begin
      v_raw_score := (v_row->>'score')::numeric;
    exception when others then
      v_raw_score := 0;
      v_clamped_count := v_clamped_count + 1;
    end;

    begin
      v_raw_learning := (v_row->>'learning_score')::numeric;
    exception when others then
      v_raw_learning := 0;
      v_clamped_count := v_clamped_count + 1;
    end;

    -- Floor non-integers
    v_score := floor(v_raw_score)::integer;
    v_learning := floor(v_raw_learning)::integer;

    -- Clamp negatives to 0
    if v_score < 0 then
      v_score := 0;
      v_clamped_count := v_clamped_count + 1;
    end if;
    if v_learning < 0 then
      v_learning := 0;
      v_clamped_count := v_clamped_count + 1;
    end if;

    -- Clamp to maximums
    if v_score > 1000 then
      v_score := 1000;
      v_clamped_count := v_clamped_count + 1;
    end if;
    if v_learning > 5 then
      v_learning := 5;
      v_clamped_count := v_clamped_count + 1;
    end if;

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

    if not exists (select 1 from leaderboard_word_catalog where word_id = v_word_id) then
      v_invalid_ids := v_invalid_ids + 1;
      v_dropped_count := v_dropped_count + 1;
      continue;
    end if;

    begin
      v_raw_score := (v_row->>'score')::numeric;
    exception when others then
      v_raw_score := 0;
      v_clamped_count := v_clamped_count + 1;
    end;

    v_score := floor(v_raw_score)::integer;

    if v_score < 0 then
      v_score := 0;
      v_clamped_count := v_clamped_count + 1;
    end if;
    if v_score > 1000 then
      v_score := 1000;
      v_clamped_count := v_clamped_count + 1;
    end if;

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
  -- If more than 50% of submitted IDs are invalid, reject the
  -- entire import. Writes already applied are rolled back by
  -- the exception.

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

revoke execute on function public.import_guest_progress from public;
grant execute on function public.import_guest_progress to authenticated;


-- ══════════════════════════════════════════════
-- import_legacy_progress: one-time import of pre-Sprint-10
-- global localStorage keys into a permanent account.
-- Same validation, clamping, and merge logic.
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
  v_id text;
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

    if not exists (select 1 from kana_character_catalog where character_id = v_char_id) then
      v_invalid_ids := v_invalid_ids + 1;
      v_dropped_count := v_dropped_count + 1;
      continue;
    end if;

    begin
      v_raw_score := (v_row->>'score')::numeric;
    exception when others then
      v_raw_score := 0;
      v_clamped_count := v_clamped_count + 1;
    end;

    begin
      v_raw_learning := (v_row->>'learning_score')::numeric;
    exception when others then
      v_raw_learning := 0;
      v_clamped_count := v_clamped_count + 1;
    end;

    v_score := floor(v_raw_score)::integer;
    v_learning := floor(v_raw_learning)::integer;

    if v_score < 0 then
      v_score := 0;
      v_clamped_count := v_clamped_count + 1;
    end if;
    if v_learning < 0 then
      v_learning := 0;
      v_clamped_count := v_clamped_count + 1;
    end if;
    if v_score > 1000 then
      v_score := 1000;
      v_clamped_count := v_clamped_count + 1;
    end if;
    if v_learning > 5 then
      v_learning := 5;
      v_clamped_count := v_clamped_count + 1;
    end if;

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

    if not exists (select 1 from leaderboard_word_catalog where word_id = v_word_id) then
      v_invalid_ids := v_invalid_ids + 1;
      v_dropped_count := v_dropped_count + 1;
      continue;
    end if;

    begin
      v_raw_score := (v_row->>'score')::numeric;
    exception when others then
      v_raw_score := 0;
      v_clamped_count := v_clamped_count + 1;
    end;

    v_score := floor(v_raw_score)::integer;

    if v_score < 0 then
      v_score := 0;
      v_clamped_count := v_clamped_count + 1;
    end if;
    if v_score > 1000 then
      v_score := 1000;
      v_clamped_count := v_clamped_count + 1;
    end if;

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

revoke execute on function public.import_legacy_progress from public;
grant execute on function public.import_legacy_progress to authenticated;
