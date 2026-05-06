// ─────────────────────────────────────────────
// File: services/word-mastery.service.ts
// Purpose: Load word mastery snapshot (scores + unlocks + epoch)
//          atomically via RPC. Sync via checkpoint RPCs.
//          Legacy direct-write functions retained for existing
//          callers (dojo unlock, onboarding sync) until direct
//          RLS policies are removed.
// Depends on: services/supabase-browser.ts, types/word.types.ts
// ─────────────────────────────────────────────

import { createBrowserSupabaseClient } from '@/services/supabase-browser'
import type { WordMasteryScoreMap } from '@/types/word.types'

// ── Types ─────────────────────────────────────

type ServiceResult<T> = { ok: true; data: T } | { ok: false; error: string }

export type WordMasterySnapshot = {
  scores: WordMasteryScoreMap
  unlockIds: string[]
  epoch: number
}

export type CheckpointResult = {
  appliedCount: number
  droppedInvalidIds: string[]
  skippedStaleCount: number
  currentEpoch: number
}

// ── Constants ─────────────────────────────────

const MAX_CHECKPOINT_ROWS = 200

// ── Helpers ───────────────────────────────────

function parseCheckpointResult(data: unknown): CheckpointResult | null {
  if (data === null || typeof data !== 'object') return null
  const d = data as Record<string, unknown>
  if (typeof d['applied_count'] !== 'number') return null
  if (typeof d['skipped_stale_count'] !== 'number') return null
  if (typeof d['current_epoch'] !== 'number') return null
  return {
    appliedCount: d['applied_count'] as number,
    droppedInvalidIds: Array.isArray(d['dropped_invalid_ids'])
      ? (d['dropped_invalid_ids'] as string[])
      : [],
    skippedStaleCount: d['skipped_stale_count'] as number,
    currentEpoch: d['current_epoch'] as number,
  }
}

// ── Load (atomic via RPC) ─────────────────────

export async function loadWordMasterySnapshot(): Promise<ServiceResult<WordMasterySnapshot>> {
  const supabase = createBrowserSupabaseClient()

  const { data, error } = await supabase.rpc('load_word_mastery_snapshot')

  if (error) {
    return { ok: false, error: 'Failed to load word mastery snapshot.' }
  }

  if (data === null || typeof data !== 'object') {
    return { ok: false, error: 'Invalid word mastery snapshot response.' }
  }

  const d = data as Record<string, unknown>
  if (
    typeof d['epoch'] !== 'number' ||
    !Array.isArray(d['scores']) ||
    !Array.isArray(d['unlocks'])
  ) {
    return { ok: false, error: 'Malformed word mastery snapshot response.' }
  }

  const scores: WordMasteryScoreMap = {}
  for (const row of d['scores'] as Array<Record<string, unknown>>) {
    if (typeof row['word_id'] === 'string' && typeof row['score'] === 'number') {
      scores[row['word_id']] = row['score']
    }
  }

  const unlockIds = (d['unlocks'] as unknown[]).filter((id): id is string => typeof id === 'string')

  return {
    ok: true,
    data: { scores, unlockIds, epoch: d['epoch'] as number },
  }
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

  if (rows.length > MAX_CHECKPOINT_ROWS) {
    return { ok: false, error: `Checkpoint payload exceeds ${MAX_CHECKPOINT_ROWS} rows.` }
  }

  const supabase = createBrowserSupabaseClient()

  const payload = rows.map((r) => ({ word_id: r.word_id, score: r.score }))

  const { data, error } = await supabase.rpc('checkpoint_word_mastery', {
    p_epoch: epoch,
    p_rows: payload,
  })

  if (error) {
    return { ok: false, error: 'Failed to sync word mastery checkpoint.' }
  }

  const result = parseCheckpointResult(data)
  if (!result) {
    return { ok: false, error: 'Invalid checkpoint response shape.' }
  }

  return { ok: true, data: result }
}

// ── Checkpoint sync (word manual unlocks) ─────

export async function checkpointWordUnlocks(
  ids: string[],
  epoch: number,
): Promise<ServiceResult<CheckpointResult>> {
  if (ids.length === 0) {
    return {
      ok: true,
      data: { appliedCount: 0, droppedInvalidIds: [], skippedStaleCount: 0, currentEpoch: epoch },
    }
  }

  if (ids.length > MAX_CHECKPOINT_ROWS) {
    return { ok: false, error: `Unlock payload exceeds ${MAX_CHECKPOINT_ROWS} IDs.` }
  }

  const supabase = createBrowserSupabaseClient()

  const { data, error } = await supabase.rpc('checkpoint_word_manual_unlocks', {
    p_epoch: epoch,
    p_ids: ids,
  })

  if (error) {
    return { ok: false, error: 'Failed to sync word unlocks.' }
  }

  const result = parseCheckpointResult(data)
  if (!result) {
    return { ok: false, error: 'Invalid checkpoint response shape.' }
  }

  return { ok: true, data: result }
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
