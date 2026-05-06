-- ---------------------------------------------------------
-- Migration: 20260507120007_create_load_snapshot_rpcs.sql
-- Purpose: Sprint 10 Phase 1 Codex fix.
--   Atomic snapshot load RPCs that read epoch + data under
--   the profile row lock. Prevents a reset between separate
--   queries from returning stale data with a new epoch.
-- ---------------------------------------------------------


-- ══════════════════════════════════════════════
-- load_mastery_snapshot: atomic epoch + scores + unlocks
-- ══════════════════════════════════════════════

create or replace function public.load_mastery_snapshot()
returns jsonb
language plpgsql
security definer set search_path = public, pg_temp
as $$
declare
  v_user_id uuid;
  v_epoch integer;
  v_scores jsonb;
  v_unlocks jsonb;
begin
  v_user_id := auth.uid();

  if not is_permanent_user() then
    raise exception 'Anonymous users cannot load mastery snapshot'
      using errcode = 'P0001';
  end if;

  -- Lock profile row to prevent reset between reads
  select mastery_reset_epoch into v_epoch
    from profiles where id = v_user_id for share;
  if not found then
    raise exception 'Profile not found' using errcode = 'P0002';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'character_id', m.character_id,
    'score', m.score,
    'learning_score', m.learning_score
  )), '[]'::jsonb)
    into v_scores
    from mastery m where m.user_id = v_user_id;

  select coalesce(jsonb_agg(mu.character_id), '[]'::jsonb)
    into v_unlocks
    from manual_unlocks mu where mu.user_id = v_user_id;

  return jsonb_build_object(
    'epoch', v_epoch,
    'scores', v_scores,
    'unlocks', v_unlocks
  );
end;
$$;

revoke execute on function public.load_mastery_snapshot from public;
grant execute on function public.load_mastery_snapshot to authenticated;


-- ══════════════════════════════════════════════
-- load_word_mastery_snapshot: atomic epoch + scores + unlocks
-- ══════════════════════════════════════════════

create or replace function public.load_word_mastery_snapshot()
returns jsonb
language plpgsql
security definer set search_path = public, pg_temp
as $$
declare
  v_user_id uuid;
  v_epoch integer;
  v_scores jsonb;
  v_unlocks jsonb;
begin
  v_user_id := auth.uid();

  if not is_permanent_user() then
    raise exception 'Anonymous users cannot load word mastery snapshot'
      using errcode = 'P0001';
  end if;

  select word_mastery_reset_epoch into v_epoch
    from profiles where id = v_user_id for share;
  if not found then
    raise exception 'Profile not found' using errcode = 'P0002';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'word_id', wm.word_id,
    'score', wm.score
  )), '[]'::jsonb)
    into v_scores
    from word_mastery wm where wm.user_id = v_user_id;

  select coalesce(jsonb_agg(wmu.word_id), '[]'::jsonb)
    into v_unlocks
    from word_manual_unlocks wmu where wmu.user_id = v_user_id;

  return jsonb_build_object(
    'epoch', v_epoch,
    'scores', v_scores,
    'unlocks', v_unlocks
  );
end;
$$;

revoke execute on function public.load_word_mastery_snapshot from public;
grant execute on function public.load_word_mastery_snapshot to authenticated;
