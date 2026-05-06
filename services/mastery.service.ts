// ─────────────────────────────────────────────
// File: services/mastery.service.ts
// Purpose: Load kana mastery scores (score + learning_score) and
//          epoch from Supabase. Sync via checkpoint_mastery and
//          checkpoint_manual_unlocks RPCs (epoch-aware, greatest-merge).
//          All writes go through RPCs that lock the profile row
//          for serialization with resets.
// Depends on: services/supabase-browser.ts, types/game.types.ts
// ─────────────────────────────────────────────

import { createBrowserSupabaseClient } from '@/services/supabase-browser'
import type { MasteryScoreMap } from '@/types/game.types'

// ── Types ─────────────────────────────────────

type ServiceResult<T> = { ok: true; data: T } | { ok: false; error: string }

export type MasterySnapshot = {
  scores: MasteryScoreMap
  learningScores: MasteryScoreMap
  epoch: number
}

export type CheckpointResult = {
  appliedCount: number
  droppedInvalidIds: string[]
  skippedStaleCount: number
  currentEpoch: number
}

// ── Load ──────────────────────────────────────

export async function loadMasterySnapshot(userId: string): Promise<ServiceResult<MasterySnapshot>> {
  const supabase = createBrowserSupabaseClient()

  const [masteryResult, profileResult] = await Promise.all([
    supabase.from('mastery').select('character_id, score, learning_score').eq('user_id', userId),
    supabase.from('profiles').select('mastery_reset_epoch').eq('id', userId).single(),
  ])

  if (masteryResult.error) {
    return { ok: false, error: 'Failed to load mastery scores.' }
  }

  if (profileResult.error) {
    return { ok: false, error: 'Failed to load mastery epoch.' }
  }

  const scores: MasteryScoreMap = {}
  const learningScores: MasteryScoreMap = {}

  for (const row of masteryResult.data ?? []) {
    const r = row as { character_id: string; score: number; learning_score: number }
    scores[r.character_id] = r.score
    learningScores[r.character_id] = r.learning_score
  }

  const epoch = (profileResult.data as { mastery_reset_epoch: number }).mastery_reset_epoch

  return { ok: true, data: { scores, learningScores, epoch } }
}

// ── Checkpoint sync (scores) ──────────────────

export type MasteryCheckpointRow = {
  character_id: string
  score: number
  learning_score: number
}

export async function syncMastery(
  rows: MasteryCheckpointRow[],
  epoch: number,
): Promise<ServiceResult<CheckpointResult>> {
  if (rows.length === 0) {
    return {
      ok: true,
      data: { appliedCount: 0, droppedInvalidIds: [], skippedStaleCount: 0, currentEpoch: epoch },
    }
  }

  const supabase = createBrowserSupabaseClient()

  const payload = rows.map((r) => ({
    character_id: r.character_id,
    score: r.score,
    learning_score: r.learning_score,
  }))

  const { data, error } = await supabase.rpc('checkpoint_mastery', {
    p_epoch: epoch,
    p_rows: payload,
  })

  if (error) {
    return { ok: false, error: 'Failed to sync mastery checkpoint.' }
  }

  const result = data as {
    applied_count: number
    dropped_invalid_ids: string[]
    skipped_stale_count: number
    current_epoch: number
  }

  return {
    ok: true,
    data: {
      appliedCount: result.applied_count,
      droppedInvalidIds: result.dropped_invalid_ids ?? [],
      skippedStaleCount: result.skipped_stale_count,
      currentEpoch: result.current_epoch,
    },
  }
}

// ── Checkpoint sync (manual unlocks) ──────────

export async function syncManualUnlocks(
  ids: string[],
  epoch: number,
): Promise<ServiceResult<CheckpointResult>> {
  if (ids.length === 0) {
    return {
      ok: true,
      data: { appliedCount: 0, droppedInvalidIds: [], skippedStaleCount: 0, currentEpoch: epoch },
    }
  }

  const supabase = createBrowserSupabaseClient()

  const { data, error } = await supabase.rpc('checkpoint_manual_unlocks', {
    p_epoch: epoch,
    p_ids: ids,
  })

  if (error) {
    return { ok: false, error: 'Failed to sync manual unlocks.' }
  }

  const result = data as {
    applied_count: number
    dropped_invalid_ids: string[]
    skipped_stale_count: number
    current_epoch: number
  }

  return {
    ok: true,
    data: {
      appliedCount: result.applied_count,
      droppedInvalidIds: result.dropped_invalid_ids ?? [],
      skippedStaleCount: result.skipped_stale_count,
      currentEpoch: result.current_epoch,
    },
  }
}

// ── Load manual unlocks ───────────────────────

export async function loadManualUnlocks(userId: string): Promise<ServiceResult<string[]>> {
  const supabase = createBrowserSupabaseClient()

  const { data, error } = await supabase
    .from('manual_unlocks')
    .select('character_id')
    .eq('user_id', userId)

  if (error) {
    return { ok: false, error: 'Failed to load manual unlocks.' }
  }

  const ids = (data ?? []).map((row: { character_id: string }) => row.character_id)
  return { ok: true, data: ids }
}
