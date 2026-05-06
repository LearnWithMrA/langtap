-- ---------------------------------------------------------
-- Migration: 20260507120006_fix_checkpoint_cast_safety.sql
-- Purpose: Fix checkpoint RPCs to safely handle non-numeric
--          score fields on invalid-ID rows. The CTE now only
--          casts scores for rows whose IDs exist in the catalog.
--          Invalid-ID rows are collected for the dropped list
--          without touching their score fields.
--          Also adds integer range check (0..2147483647) to
--          prevent overflow on cast.
-- ---------------------------------------------------------


-- ══════════════════════════════════════════════
-- checkpoint_mastery: safe cast for invalid-ID rows
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

  if p_rows is null or jsonb_typeof(p_rows) != 'array' then
    raise exception 'p_rows must be a JSON array' using errcode = 'P0004';
  end if;

  if jsonb_array_length(p_rows) > 200 then
    raise exception 'Payload exceeds 200 rows' using errcode = 'P0004';
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
      'skipped_stale_count', jsonb_array_length(p_rows),
      'current_epoch', v_server_epoch
    );
  end if;

  -- Collect dropped IDs (invalid character_id)
  select coalesce(array_agg(distinct r->>'character_id'), '{}')
    into v_dropped_ids
    from jsonb_array_elements(p_rows) as r
    where not exists (
      select 1 from kana_character_catalog c
      where c.character_id = r->>'character_id'
    );

  -- Apply only catalog-valid rows (scores are safe to cast here)
  -- Reject rows with non-numeric or out-of-range scores
  with catalog_rows as (
    select
      (r->>'character_id')::text as char_id,
      r->>'score' as score_raw,
      r->>'learning_score' as learning_raw
    from jsonb_array_elements(p_rows) as r
    where exists (
      select 1 from kana_character_catalog c
      where c.character_id = r->>'character_id'
    )
  ),
  safe_rows as (
    select
      char_id,
      score_raw::integer as score,
      learning_raw::integer as learning
    from catalog_rows
    where score_raw ~ '^\d{1,10}$'
      and learning_raw ~ '^\d{1,10}$'
      and score_raw::bigint between 0 and 2147483647
      and learning_raw::bigint between 0 and 5
  ),
  aggregated as (
    select char_id, max(score) as score, max(learning) as learning
    from safe_rows
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
  select count(*) into v_applied from applied;

  return jsonb_build_object(
    'applied_count', v_applied,
    'dropped_invalid_ids', to_jsonb(v_dropped_ids),
    'skipped_stale_count', 0,
    'current_epoch', v_server_epoch
  );
end;
$$;


-- ══════════════════════════════════════════════
-- checkpoint_word_mastery: same safe cast fix
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

  select coalesce(array_agg(distinct r->>'word_id'), '{}')
    into v_dropped_ids
    from jsonb_array_elements(p_rows) as r
    where not exists (
      select 1 from leaderboard_word_catalog c
      where c.word_id = r->>'word_id'
    );

  with catalog_rows as (
    select
      (r->>'word_id')::text as word_id,
      r->>'score' as score_raw
    from jsonb_array_elements(p_rows) as r
    where exists (
      select 1 from leaderboard_word_catalog c
      where c.word_id = r->>'word_id'
    )
  ),
  safe_rows as (
    select
      word_id,
      score_raw::integer as score
    from catalog_rows
    where score_raw ~ '^\d{1,10}$'
      and score_raw::bigint between 0 and 2147483647
  ),
  aggregated as (
    select word_id, max(score) as score
    from safe_rows
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
  select count(*) into v_applied from applied;

  return jsonb_build_object(
    'applied_count', v_applied,
    'dropped_invalid_ids', to_jsonb(v_dropped_ids),
    'skipped_stale_count', 0,
    'current_epoch', v_server_epoch
  );
end;
$$;
