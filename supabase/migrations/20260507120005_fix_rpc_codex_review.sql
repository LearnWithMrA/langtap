-- ---------------------------------------------------------
-- Migration: 20260507120005_fix_rpc_codex_review.sql
-- Purpose: Fixes from Codex staff-engineer review of RPCs.
--   1. Checkpoint RPCs: validate jsonb type before cast,
--      reject batch on malformed valid-ID rows, pre-aggregate
--      duplicates with max() instead of first-wins.
--   2. Reset RPCs: validate character/word IDs against catalogs
--      before incrementing epoch.
--   3. Skip-import RPCs: check for contradictory state.
--   4. Username RPC: catch unique_violation exception.
-- ---------------------------------------------------------


-- ══════════════════════════════════════════════
-- Fix 1: checkpoint_mastery - safe JSON parsing,
--         max-aggregate dedup, reject malformed rows
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
  v_applied integer := 0;
  v_dropped_ids text[] := '{}';
begin
  v_user_id := auth.uid();

  if not is_permanent_user() then
    raise exception 'Anonymous users cannot checkpoint mastery'
      using errcode = 'P0001';
  end if;

  -- Validate JSON type before anything else
  if p_rows is null or jsonb_typeof(p_rows) != 'array' then
    raise exception 'p_rows must be a JSON array' using errcode = 'P0004';
  end if;

  if jsonb_array_length(p_rows) > 200 then
    raise exception 'Payload exceeds 200 rows' using errcode = 'P0004';
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

  -- Pre-validate all rows: reject entire batch if any valid-ID row
  -- has malformed score fields (prevents silent data loss)
  declare
    v_row jsonb;
    v_char_id text;
    v_score_raw text;
    v_learning_raw text;
  begin
    for v_row in select * from jsonb_array_elements(p_rows) loop
      v_char_id := v_row->>'character_id';

      if v_char_id is null then
        raise exception 'Row missing character_id' using errcode = 'P0004';
      end if;

      -- Only validate score fields for rows with valid catalog IDs
      if exists (select 1 from kana_character_catalog where character_id = v_char_id) then
        v_score_raw := v_row->>'score';
        v_learning_raw := v_row->>'learning_score';

        if v_score_raw is null or v_learning_raw is null then
          raise exception 'Row for % missing score fields', v_char_id
            using errcode = 'P0004';
        end if;

        -- Validate they are numeric before casting
        if v_score_raw !~ '^\d+$' or v_learning_raw !~ '^\d+$' then
          raise exception 'Row for % has non-integer score', v_char_id
            using errcode = 'P0004';
        end if;
      end if;
    end loop;
  end;

  -- Apply rows using max-aggregate dedup via a CTE
  with parsed as (
    select
      (r->>'character_id')::text as char_id,
      (r->>'score')::integer as score,
      (r->>'learning_score')::integer as learning
    from jsonb_array_elements(p_rows) as r
  ),
  validated as (
    select p.char_id, p.score, p.learning
    from parsed p
    where exists (select 1 from kana_character_catalog c where c.character_id = p.char_id)
      and p.score >= 0
      and p.learning >= 0
      and p.learning <= 5
  ),
  dropped as (
    select distinct p.char_id
    from parsed p
    where not exists (select 1 from kana_character_catalog c where c.character_id = p.char_id)
  ),
  aggregated as (
    select char_id, max(score) as score, max(learning) as learning
    from validated
    group by char_id
  ),
  applied as (
    insert into mastery (user_id, character_id, score, learning_score)
    select v_user_id, a.char_id, a.score, a.learning
    from aggregated a
    on conflict (user_id, character_id) do update set
      score = greatest(mastery.score, excluded.score),
      learning_score = greatest(mastery.learning_score, excluded.learning_score)
    returning 1
  )
  select
    (select count(*) from applied),
    (select array_agg(char_id) from dropped)
  into v_applied, v_dropped_ids;

  if v_dropped_ids is null then
    v_dropped_ids := '{}';
  end if;

  return jsonb_build_object(
    'applied_count', v_applied,
    'dropped_invalid_ids', to_jsonb(v_dropped_ids),
    'skipped_stale_count', 0,
    'current_epoch', v_server_epoch
  );
end;
$$;


-- ══════════════════════════════════════════════
-- Fix 2: checkpoint_word_mastery - same fixes
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
  v_applied integer := 0;
  v_dropped_ids text[] := '{}';
begin
  v_user_id := auth.uid();

  if not is_permanent_user() then
    raise exception 'Anonymous users cannot checkpoint word mastery'
      using errcode = 'P0001';
  end if;

  if p_rows is null or jsonb_typeof(p_rows) != 'array' then
    raise exception 'p_rows must be a JSON array' using errcode = 'P0004';
  end if;

  if jsonb_array_length(p_rows) > 200 then
    raise exception 'Payload exceeds 200 rows' using errcode = 'P0004';
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

  -- Pre-validate: reject batch on malformed valid-ID rows
  declare
    v_row jsonb;
    v_word_id text;
    v_score_raw text;
  begin
    for v_row in select * from jsonb_array_elements(p_rows) loop
      v_word_id := v_row->>'word_id';
      if v_word_id is null then
        raise exception 'Row missing word_id' using errcode = 'P0004';
      end if;
      if exists (select 1 from leaderboard_word_catalog where word_id = v_word_id) then
        v_score_raw := v_row->>'score';
        if v_score_raw is null then
          raise exception 'Row for % missing score', v_word_id
            using errcode = 'P0004';
        end if;
        if v_score_raw !~ '^\d+$' then
          raise exception 'Row for % has non-integer score', v_word_id
            using errcode = 'P0004';
        end if;
      end if;
    end loop;
  end;

  with parsed as (
    select
      (r->>'word_id')::text as word_id,
      (r->>'score')::integer as score
    from jsonb_array_elements(p_rows) as r
  ),
  validated as (
    select p.word_id, p.score
    from parsed p
    where exists (select 1 from leaderboard_word_catalog c where c.word_id = p.word_id)
      and p.score >= 0
  ),
  dropped as (
    select distinct p.word_id
    from parsed p
    where not exists (select 1 from leaderboard_word_catalog c where c.word_id = p.word_id)
  ),
  aggregated as (
    select word_id, max(score) as score
    from validated
    group by word_id
  ),
  applied as (
    insert into word_mastery (user_id, word_id, score)
    select v_user_id, a.word_id, a.score
    from aggregated a
    on conflict (user_id, word_id) do update set
      score = greatest(word_mastery.score, excluded.score)
    returning 1
  )
  select
    (select count(*) from applied),
    (select array_agg(word_id) from dropped)
  into v_applied, v_dropped_ids;

  if v_dropped_ids is null then
    v_dropped_ids := '{}';
  end if;

  return jsonb_build_object(
    'applied_count', v_applied,
    'dropped_invalid_ids', to_jsonb(v_dropped_ids),
    'skipped_stale_count', 0,
    'current_epoch', v_server_epoch
  );
end;
$$;


-- ══════════════════════════════════════════════
-- Fix 3: reset_character_mastery - validate ID before epoch bump
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

  -- Validate character ID before taking any action
  if not exists (
    select 1 from kana_character_catalog where character_id = p_character_id
  ) then
    raise exception 'Unknown character_id: %', p_character_id
      using errcode = 'P0003';
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


-- ══════════════════════════════════════════════
-- Fix 4: skip RPCs - check for contradictory state
-- ══════════════════════════════════════════════

create or replace function public.skip_guest_import()
returns jsonb
language plpgsql
security definer set search_path = public, pg_temp
as $$
declare
  v_user_id uuid;
  v_imported_at timestamptz;
  v_skipped_at timestamptz;
begin
  v_user_id := auth.uid();

  if not is_permanent_user() then
    raise exception 'Anonymous users cannot skip import'
      using errcode = 'P0001';
  end if;

  select guest_imported_at, guest_import_skipped_at
    into v_imported_at, v_skipped_at
    from profiles where id = v_user_id for update;
  if not found then
    raise exception 'Profile not found' using errcode = 'P0002';
  end if;

  if v_imported_at is not null then
    return jsonb_build_object('ok', false, 'error_code', 'already_imported');
  end if;
  if v_skipped_at is not null then
    return jsonb_build_object('ok', false, 'error_code', 'already_skipped');
  end if;

  update profiles
    set guest_import_skipped_at = now()
    where id = v_user_id;

  return jsonb_build_object('ok', true);
end;
$$;


create or replace function public.skip_legacy_import()
returns jsonb
language plpgsql
security definer set search_path = public, pg_temp
as $$
declare
  v_user_id uuid;
  v_imported_at timestamptz;
  v_skipped_at timestamptz;
begin
  v_user_id := auth.uid();

  if not is_permanent_user() then
    raise exception 'Anonymous users cannot skip import'
      using errcode = 'P0001';
  end if;

  select legacy_imported_at, legacy_import_skipped_at
    into v_imported_at, v_skipped_at
    from profiles where id = v_user_id for update;
  if not found then
    raise exception 'Profile not found' using errcode = 'P0002';
  end if;

  if v_imported_at is not null then
    return jsonb_build_object('ok', false, 'error_code', 'already_imported');
  end if;
  if v_skipped_at is not null then
    return jsonb_build_object('ok', false, 'error_code', 'already_skipped');
  end if;

  update profiles
    set legacy_import_skipped_at = now()
    where id = v_user_id;

  return jsonb_build_object('ok', true);
end;
$$;


-- ══════════════════════════════════════════════
-- Fix 5: change_username - catch unique_violation
-- ══════════════════════════════════════════════

create or replace function public.change_username(p_new_username text)
returns jsonb
language plpgsql
security definer set search_path = public, pg_temp
as $$
declare
  v_user_id uuid;
  v_current_changed_at timestamptz;
  v_trimmed text;
  v_next_allowed timestamptz;
begin
  v_user_id := auth.uid();

  if not is_permanent_user() then
    return jsonb_build_object(
      'ok', false,
      'error_code', 'unauthorized'
    );
  end if;

  select username_changed_at into v_current_changed_at
    from profiles where id = v_user_id for update;
  if not found then
    raise exception 'Profile not found' using errcode = 'P0002';
  end if;

  v_trimmed := btrim(p_new_username);

  if length(v_trimmed) < 3 or length(v_trimmed) > 20 then
    return jsonb_build_object(
      'ok', false,
      'error_code', 'invalid_format'
    );
  end if;

  if v_trimmed !~ '^[a-zA-Z0-9_]+$' then
    return jsonb_build_object(
      'ok', false,
      'error_code', 'invalid_format'
    );
  end if;

  if v_current_changed_at is not null
     and now() < v_current_changed_at + interval '30 days' then
    v_next_allowed := v_current_changed_at + interval '30 days';
    return jsonb_build_object(
      'ok', false,
      'error_code', 'cooldown_active',
      'next_allowed_at', v_next_allowed
    );
  end if;

  if exists (
    select 1 from profiles
    where lower(username) = lower(v_trimmed)
      and id != v_user_id
  ) then
    return jsonb_build_object(
      'ok', false,
      'error_code', 'username_taken'
    );
  end if;

  perform set_config('app.allow_username_change', '1', true);

  begin
    update profiles
      set username = v_trimmed,
          username_changed_at = now()
      where id = v_user_id;
  exception
    when unique_violation then
      return jsonb_build_object(
        'ok', false,
        'error_code', 'username_taken'
      );
  end;

  return jsonb_build_object('ok', true);
end;
$$;
