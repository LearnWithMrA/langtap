-- ---------------------------------------------------------
-- Migration: 20260507120004_create_checkpoint_rpcs.sql
-- Purpose: Sprint 10 Phase 0g.
--   Create four checkpoint sync RPCs for mastery scores,
--   word mastery scores, manual unlocks, and word manual
--   unlocks. All use profile row lock serialization, exact
--   epoch matching, catalog ID validation, deduplication,
--   and greatest(existing, incoming) merge.
-- ---------------------------------------------------------


-- ══════════════════════════════════════════════
-- checkpoint_mastery: sync kana mastery scores
-- ══════════════════════════════════════════════

create or replace function public.checkpoint_mastery(
  p_epoch integer,
  p_rows jsonb
)
returns jsonb
language plpgsql
security definer set search_path = public, pg_temp
as $$
declare
  v_user_id uuid;
  v_server_epoch integer;
  v_row jsonb;
  v_char_id text;
  v_score integer;
  v_learning integer;
  v_applied integer := 0;
  v_dropped_ids text[] := '{}';
  v_seen_ids text[] := '{}';
  v_deduped jsonb[] := '{}';
begin
  v_user_id := auth.uid();

  if not is_permanent_user() then
    raise exception 'Anonymous users cannot checkpoint mastery'
      using errcode = 'P0001';
  end if;

  -- Lock the serialization row
  select mastery_reset_epoch into v_server_epoch
    from profiles where id = v_user_id for update;
  if not found then
    raise exception 'Profile not found' using errcode = 'P0002';
  end if;

  -- Exact epoch match
  if p_epoch != v_server_epoch then
    return jsonb_build_object(
      'applied_count', 0,
      'dropped_invalid_ids', '[]'::jsonb,
      'skipped_stale_count', jsonb_array_length(p_rows),
      'current_epoch', v_server_epoch
    );
  end if;

  -- Validate payload size
  if jsonb_array_length(p_rows) > 200 then
    raise exception 'Payload exceeds 200 rows' using errcode = 'P0004';
  end if;

  -- Validate, deduplicate, and apply rows
  for v_row in select * from jsonb_array_elements(p_rows) loop
    v_char_id := v_row->>'character_id';
    v_score := (v_row->>'score')::integer;
    v_learning := (v_row->>'learning_score')::integer;

    -- Type/range validation
    if v_char_id is null or v_score is null or v_learning is null then
      continue;
    end if;
    if v_score < 0 or v_learning < 0 or v_learning > 5 then
      continue;
    end if;

    -- Catalog validation
    if not exists (
      select 1 from kana_character_catalog where character_id = v_char_id
    ) then
      v_dropped_ids := array_append(v_dropped_ids, v_char_id);
      continue;
    end if;

    -- Deduplication: skip if already seen (first occurrence wins after
    -- rows are processed in order; the caller should send max values)
    if v_char_id = any(v_seen_ids) then
      continue;
    end if;
    v_seen_ids := array_append(v_seen_ids, v_char_id);

    -- Apply with greatest-merge
    insert into mastery (user_id, character_id, score, learning_score)
      values (v_user_id, v_char_id, v_score, v_learning)
      on conflict (user_id, character_id) do update set
        score = greatest(mastery.score, excluded.score),
        learning_score = greatest(mastery.learning_score, excluded.learning_score);

    v_applied := v_applied + 1;
  end loop;

  return jsonb_build_object(
    'applied_count', v_applied,
    'dropped_invalid_ids', to_jsonb(v_dropped_ids),
    'skipped_stale_count', 0,
    'current_epoch', v_server_epoch
  );
end;
$$;

revoke execute on function public.checkpoint_mastery from public;
grant execute on function public.checkpoint_mastery to authenticated;


-- ══════════════════════════════════════════════
-- checkpoint_word_mastery: sync word mastery scores
-- ══════════════════════════════════════════════

create or replace function public.checkpoint_word_mastery(
  p_epoch integer,
  p_rows jsonb
)
returns jsonb
language plpgsql
security definer set search_path = public, pg_temp
as $$
declare
  v_user_id uuid;
  v_server_epoch integer;
  v_row jsonb;
  v_word_id text;
  v_score integer;
  v_applied integer := 0;
  v_dropped_ids text[] := '{}';
  v_seen_ids text[] := '{}';
begin
  v_user_id := auth.uid();

  if not is_permanent_user() then
    raise exception 'Anonymous users cannot checkpoint word mastery'
      using errcode = 'P0001';
  end if;

  select word_mastery_reset_epoch into v_server_epoch
    from profiles where id = v_user_id for update;
  if not found then
    raise exception 'Profile not found' using errcode = 'P0002';
  end if;

  if p_epoch != v_server_epoch then
    return jsonb_build_object(
      'applied_count', 0,
      'dropped_invalid_ids', '[]'::jsonb,
      'skipped_stale_count', jsonb_array_length(p_rows),
      'current_epoch', v_server_epoch
    );
  end if;

  if jsonb_array_length(p_rows) > 200 then
    raise exception 'Payload exceeds 200 rows' using errcode = 'P0004';
  end if;

  for v_row in select * from jsonb_array_elements(p_rows) loop
    v_word_id := v_row->>'word_id';
    v_score := (v_row->>'score')::integer;

    if v_word_id is null or v_score is null then
      continue;
    end if;
    if v_score < 0 then
      continue;
    end if;

    if not exists (
      select 1 from leaderboard_word_catalog where word_id = v_word_id
    ) then
      v_dropped_ids := array_append(v_dropped_ids, v_word_id);
      continue;
    end if;

    if v_word_id = any(v_seen_ids) then
      continue;
    end if;
    v_seen_ids := array_append(v_seen_ids, v_word_id);

    insert into word_mastery (user_id, word_id, score)
      values (v_user_id, v_word_id, v_score)
      on conflict (user_id, word_id) do update set
        score = greatest(word_mastery.score, excluded.score);

    v_applied := v_applied + 1;
  end loop;

  return jsonb_build_object(
    'applied_count', v_applied,
    'dropped_invalid_ids', to_jsonb(v_dropped_ids),
    'skipped_stale_count', 0,
    'current_epoch', v_server_epoch
  );
end;
$$;

revoke execute on function public.checkpoint_word_mastery from public;
grant execute on function public.checkpoint_word_mastery to authenticated;


-- ══════════════════════════════════════════════
-- checkpoint_manual_unlocks: sync kana manual unlocks
-- ══════════════════════════════════════════════

create or replace function public.checkpoint_manual_unlocks(
  p_epoch integer,
  p_ids text[]
)
returns jsonb
language plpgsql
security definer set search_path = public, pg_temp
as $$
declare
  v_user_id uuid;
  v_server_epoch integer;
  v_id text;
  v_applied integer := 0;
  v_dropped_ids text[] := '{}';
begin
  v_user_id := auth.uid();

  if not is_permanent_user() then
    raise exception 'Anonymous users cannot checkpoint unlocks'
      using errcode = 'P0001';
  end if;

  select mastery_reset_epoch into v_server_epoch
    from profiles where id = v_user_id for update;
  if not found then
    raise exception 'Profile not found' using errcode = 'P0002';
  end if;

  if p_epoch != v_server_epoch then
    return jsonb_build_object(
      'applied_count', 0,
      'dropped_invalid_ids', '[]'::jsonb,
      'skipped_stale_count', array_length(p_ids, 1),
      'current_epoch', v_server_epoch
    );
  end if;

  if array_length(p_ids, 1) > 200 then
    raise exception 'Payload exceeds 200 IDs' using errcode = 'P0004';
  end if;

  foreach v_id in array p_ids loop
    if not exists (
      select 1 from kana_character_catalog where character_id = v_id
    ) then
      v_dropped_ids := array_append(v_dropped_ids, v_id);
      continue;
    end if;

    insert into manual_unlocks (user_id, character_id)
      values (v_user_id, v_id)
      on conflict do nothing;

    v_applied := v_applied + 1;
  end loop;

  return jsonb_build_object(
    'applied_count', v_applied,
    'dropped_invalid_ids', to_jsonb(v_dropped_ids),
    'skipped_stale_count', 0,
    'current_epoch', v_server_epoch
  );
end;
$$;

revoke execute on function public.checkpoint_manual_unlocks from public;
grant execute on function public.checkpoint_manual_unlocks to authenticated;


-- ══════════════════════════════════════════════
-- checkpoint_word_manual_unlocks: sync word manual unlocks
-- ══════════════════════════════════════════════

create or replace function public.checkpoint_word_manual_unlocks(
  p_epoch integer,
  p_ids text[]
)
returns jsonb
language plpgsql
security definer set search_path = public, pg_temp
as $$
declare
  v_user_id uuid;
  v_server_epoch integer;
  v_id text;
  v_applied integer := 0;
  v_dropped_ids text[] := '{}';
begin
  v_user_id := auth.uid();

  if not is_permanent_user() then
    raise exception 'Anonymous users cannot checkpoint word unlocks'
      using errcode = 'P0001';
  end if;

  select word_mastery_reset_epoch into v_server_epoch
    from profiles where id = v_user_id for update;
  if not found then
    raise exception 'Profile not found' using errcode = 'P0002';
  end if;

  if p_epoch != v_server_epoch then
    return jsonb_build_object(
      'applied_count', 0,
      'dropped_invalid_ids', '[]'::jsonb,
      'skipped_stale_count', array_length(p_ids, 1),
      'current_epoch', v_server_epoch
    );
  end if;

  if array_length(p_ids, 1) > 200 then
    raise exception 'Payload exceeds 200 IDs' using errcode = 'P0004';
  end if;

  foreach v_id in array p_ids loop
    if not exists (
      select 1 from leaderboard_word_catalog where word_id = v_id
    ) then
      v_dropped_ids := array_append(v_dropped_ids, v_id);
      continue;
    end if;

    insert into word_manual_unlocks (user_id, word_id)
      values (v_user_id, v_id)
      on conflict do nothing;

    v_applied := v_applied + 1;
  end loop;

  return jsonb_build_object(
    'applied_count', v_applied,
    'dropped_invalid_ids', to_jsonb(v_dropped_ids),
    'skipped_stale_count', 0,
    'current_epoch', v_server_epoch
  );
end;
$$;

revoke execute on function public.checkpoint_word_manual_unlocks from public;
grant execute on function public.checkpoint_word_manual_unlocks to authenticated;
