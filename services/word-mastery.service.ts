// ─────────────────────────────────────────────
// File: services/word-mastery.service.ts
// Purpose: Load word mastery scores and manual word unlocks from
//          Supabase on session start. Sync deltas at session end.
//          Delta strategy: only changed rows are upserted.
//          Manual unlocks write immediately (additive only).
// Depends on: services/supabase-browser.ts, types/word.types.ts
// ─────────────────────────────────────────────

import { createBrowserSupabaseClient } from '@/services/supabase-browser'
import type { WordMasteryScoreMap } from '@/types/word.types'

// ── Types ─────────────────────────────────────

type ServiceResult<T> = { ok: true; data: T } | { ok: false; error: string }

// ── Word mastery ──────────────────────────────

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
    scores[(row as { word_id: string; score: number }).word_id] = (
      row as { word_id: string; score: number }
    ).score
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

// ── Word manual unlocks ───────────────────────

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
