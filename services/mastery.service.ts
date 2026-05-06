// ─────────────────────────────────────────────
// File: services/mastery.service.ts
// Purpose: Load kana mastery snapshot (scores + learning + unlocks +
//          epoch) atomically via RPC. Sync via checkpoint RPCs.
//          All reads and writes go through RPCs that lock the
//          profile row for epoch consistency and reset serialization.
// Depends on: services/supabase-browser.ts, types/game.types.ts
// ─────────────────────────────────────────────

import { createBrowserSupabaseClient } from '@/services/supabase-browser'
import type { MasteryScoreMap } from '@/types/game.types'

// ── Types ─────────────────────────────────────

type ServiceResult<T> = { ok: true; data: T } | { ok: false; error: string }

export type MasterySnapshot = {
  scores: MasteryScoreMap
  learningScores: MasteryScoreMap
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

export async function loadMasterySnapshot(): Promise<ServiceResult<MasterySnapshot>> {
  const supabase = createBrowserSupabaseClient()

  const { data, error } = await supabase.rpc('load_mastery_snapshot')

  if (error) {
    return { ok: false, error: 'Failed to load mastery snapshot.' }
  }

  if (data === null || typeof data !== 'object') {
    return { ok: false, error: 'Invalid mastery snapshot response.' }
  }

  const d = data as Record<string, unknown>
  if (
    typeof d['epoch'] !== 'number' ||
    !Array.isArray(d['scores']) ||
    !Array.isArray(d['unlocks'])
  ) {
    return { ok: false, error: 'Malformed mastery snapshot response.' }
  }

  const scores: MasteryScoreMap = {}
  const learningScores: MasteryScoreMap = {}

  for (const row of d['scores'] as Array<Record<string, unknown>>) {
    if (typeof row['character_id'] === 'string' && typeof row['score'] === 'number') {
      scores[row['character_id']] = row['score']
    }
    if (typeof row['character_id'] === 'string' && typeof row['learning_score'] === 'number') {
      learningScores[row['character_id']] = row['learning_score']
    }
  }

  const unlockIds = (d['unlocks'] as unknown[]).filter((id): id is string => typeof id === 'string')

  return {
    ok: true,
    data: { scores, learningScores, unlockIds, epoch: d['epoch'] as number },
  }
}

// ── Checkpoint sync (scores) ──────────────────

export type MasteryCheckpointRow = {
  character_id: string
  score: number
  learning_score: number
}

export async function checkpointMastery(
  rows: MasteryCheckpointRow[],
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

  const result = parseCheckpointResult(data)
  if (!result) {
    return { ok: false, error: 'Invalid checkpoint response shape.' }
  }

  return { ok: true, data: result }
}

// ── Checkpoint sync (manual unlocks) ──────────

export async function checkpointKanaUnlocks(
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

  const { data, error } = await supabase.rpc('checkpoint_manual_unlocks', {
    p_epoch: epoch,
    p_ids: ids,
  })

  if (error) {
    return { ok: false, error: 'Failed to sync kana unlocks.' }
  }

  const result = parseCheckpointResult(data)
  if (!result) {
    return { ok: false, error: 'Invalid checkpoint response shape.' }
  }

  return { ok: true, data: result }
}
