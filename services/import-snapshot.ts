// ─────────────────────────────────────────────
// File: services/import-snapshot.ts
// Purpose: Build an ImportPayload from raw localStorage data.
//          Parses Zustand persist format (state wrapper + version)
//          from guest keys, legacy keys, or pending keys.
//          Handles v1 mastery stores (no learningScores) by
//          backfilling from scores (same as store migration).
// Depends on: services/guest-import.service.ts (types only)
// ─────────────────────────────────────────────

import type { ImportPayload } from '@/services/guest-import.service'

// ── Types ─────────────────────────────────────

type ZustandPersistWrapper = {
  state: Record<string, unknown>
  version?: number
}

// ── Helpers ───────────────────────────────────

function parsePersistedStore(raw: string | undefined): ZustandPersistWrapper | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as unknown
    if (parsed !== null && typeof parsed === 'object' && 'state' in parsed) {
      return parsed as ZustandPersistWrapper
    }
    return null
  } catch {
    return null
  }
}

function isScoreMap(value: unknown): value is Record<string, number> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false
  for (const v of Object.values(value as Record<string, unknown>)) {
    if (typeof v !== 'number') return false
  }
  return true
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === 'string')
}

// ── Main export ───────────────────────────────

export function buildImportPayload(rawKeys: Record<string, string>): ImportPayload {
  const masteryWrapper = parsePersistedStore(rawKeys['langtap-mastery'])
  const wordMasteryWrapper = parsePersistedStore(rawKeys['langtap-word-mastery'])
  const onboardingWrapper = parsePersistedStore(rawKeys['langtap-onboarding'])

  const payload: ImportPayload = {
    mastery: [],
    word_mastery: [],
    manual_unlocks: [],
    word_manual_unlocks: [],
  }

  // Kana mastery scores + learning scores
  if (masteryWrapper) {
    const { state, version } = masteryWrapper
    const scores = isScoreMap(state.scores) ? state.scores : {}
    let learningScores = isScoreMap(state.learningScores) ? state.learningScores : {}

    // v1 stores have no learningScores; backfill from scores (capped at 5)
    if ((version ?? 1) < 2 && Object.keys(learningScores).length === 0) {
      const backfilled: Record<string, number> = {}
      for (const [id, score] of Object.entries(scores)) {
        if (score > 0) backfilled[id] = Math.min(score, 5)
      }
      learningScores = backfilled
    }

    const allIds = new Set([...Object.keys(scores), ...Object.keys(learningScores)])
    for (const id of allIds) {
      payload.mastery.push({
        character_id: id,
        score: scores[id] ?? 0,
        learning_score: learningScores[id] ?? 0,
      })
    }
  }

  // Word mastery scores
  if (wordMasteryWrapper) {
    const { state } = wordMasteryWrapper
    const scores = isScoreMap(state.scores) ? state.scores : {}

    for (const [id, score] of Object.entries(scores)) {
      payload.word_mastery.push({ word_id: id, score })
    }

    // Word manual unlocks
    if (isStringArray(state.manuallyUnlockedWords)) {
      payload.word_manual_unlocks = [...state.manuallyUnlockedWords]
    }
  }

  // Kana manual unlocks from onboarding store
  if (onboardingWrapper) {
    const { state } = onboardingWrapper
    if (isStringArray(state.selectedCharacterIds)) {
      payload.manual_unlocks = [...state.selectedCharacterIds]
    }
  }

  return payload
}
