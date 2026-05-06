// ─────────────────────────────────────────────
// File: services/word-mastery.service.ts
// Purpose: Load word mastery scores, epoch, and manual word unlocks
//          from Supabase. Sync via checkpoint_word_mastery and
//          checkpoint_word_manual_unlocks RPCs (epoch-aware,
//          greatest-merge). Legacy direct-write functions are
//          retained for existing callers until direct RLS policies
//          are removed in a later Phase 1 task.
// Depends on: services/supabase-browser.ts, types/word.types.ts
// ─────────────────────────────────────────────

import { createBrowserSupabaseClient } from '@/services/supabase-browser'
import type { WordMasteryScoreMap } from '@/types/word.types'

// ── Types ─────────────────────────────────────

type ServiceResult<T> = { ok: true; data: T } | { ok: false; error: string }

export type WordMasterySnapshot = {
  scores: WordMasteryScoreMap
  epoch: number
}

export type CheckpointResult = {
  appliedCount: number
  droppedInvalidIds: string[]
  skippedStaleCount: number
  currentEpoch: number
}

// ── Load (with epoch) ─────────────────────────

export async function loadWordMasterySnapshot(
  userId: string,
): Promise<ServiceResult<WordMasterySnapshot>> {
  const supabase = createBrowserSupabaseClient()

  const [masteryResult, profileResult] = await Promise.all([
    supabase.from('word_mastery').select('word_id, score').eq('user_id', userId),
    supabase.from('profiles').select('word_mastery_reset_epoch').eq('id', userId).single(),
  ])

  if (masteryResult.error) {
    return { ok: false, error: 'Failed to load word mastery.' }
  }

  if (profileResult.error) {
    return { ok: false, error: 'Failed to load word mastery epoch.' }
  }

  const scores: WordMasteryScoreMap = {}
  for (const row of masteryResult.data ?? []) {
    const r = row as { word_id: string; score: number }
    scores[r.word_id] = r.score
  }

  const epoch = (profileResult.data as { word_mastery_reset_epoch: number })
    .word_mastery_reset_epoch

  return { ok: true, data: { scores, epoch } }
}

// ── Checkpoint sync (scores) ──────────────────

export type WordMasteryCheckpointRow = {
  word_id: string
  score: number
}

export async function checkpointWordMastery(
  rows: WordMasteryCheckpointRow[],
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
    word_id: r.word_id,
    score: r.score,
  }))

  const { data, error } = await supabase.rpc('checkpoint_word_mastery', {
    p_epoch: epoch,
    p_rows: payload,
  })

  if (error) {
    return { ok: false, error: 'Failed to sync word mastery checkpoint.' }
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

// ── Checkpoint sync (word manual unlocks) ─────

export async function checkpointWordManualUnlocks(
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

  const { data, error } = await supabase.rpc('checkpoint_word_manual_unlocks', {
    p_epoch: epoch,
    p_ids: ids,
  })

  if (error) {
    return { ok: false, error: 'Failed to sync word manual unlocks.' }
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

// ── Load word manual unlocks ──────────────────

export async function loadWordManualUnlocks(userId: string): Promise<ServiceResult<string[]>> {
  const supabase = createBrowserSupabaseClient()

  const { data, error } = await supabase
    .from('word_manual_unlocks')
    .select('word_id')
    .eq('user_id', userId)

  if (error) {
    return { ok: false, error: 'Failed to load word unlocks.' }
  }

  const ids = (data ?? []).map((row: { word_id: string }) => row.word_id)
  return { ok: true, data: ids }
}

// ── Legacy direct-write functions ─────────────
// Retained for existing callers (dojo unlock, onboarding sync).
// Will be removed when direct INSERT/UPDATE RLS policies are
// dropped and all writes move behind checkpoint RPCs.

export async function loadWordMastery(userId: string): Promise<ServiceResult<WordMasteryScoreMap>> {
  const supabase = createBrowserSupabaseClient()

  const { data, error } = await supabase
    .from('word_mastery')
    .select('word_id, score')
    .eq('user_id', userId)

  if (error) {
    return { ok: false, error: 'Failed to load word mastery.' }
  }

  const scores: WordMasteryScoreMap = {}
  for (const row of data ?? []) {
    const r = row as { word_id: string; score: number }
    scores[r.word_id] = r.score
  }

  return { ok: true, data: scores }
}

export async function syncWordMastery(
  userId: string,
  changedScores: WordMasteryScoreMap,
): Promise<ServiceResult<void>> {
  const ids = Object.keys(changedScores)
  if (ids.length === 0) {
    return { ok: true, data: undefined }
  }

  const supabase = createBrowserSupabaseClient()

  const rows = ids.map((wordId) => ({
    user_id: userId,
    word_id: wordId,
    score: changedScores[wordId],
  }))

  const { error } = await supabase
    .from('word_mastery')
    .upsert(rows, { onConflict: 'user_id,word_id' })

  if (error) {
    return { ok: false, error: 'Failed to sync word mastery.' }
  }

  return { ok: true, data: undefined }
}

export async function syncWordManualUnlocks(
  userId: string,
  wordIds: string[],
): Promise<ServiceResult<void>> {
  if (wordIds.length === 0) {
    return { ok: true, data: undefined }
  }

  const supabase = createBrowserSupabaseClient()

  const rows = wordIds.map((wordId) => ({
    user_id: userId,
    word_id: wordId,
  }))

  const { error } = await supabase
    .from('word_manual_unlocks')
    .upsert(rows, { onConflict: 'user_id,word_id' })

  if (error) {
    return { ok: false, error: 'Failed to save word unlocks.' }
  }

  return { ok: true, data: undefined }
}
