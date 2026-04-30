// ------------------------------------------------------------
// File: engine/kotoba-progression.ts
// Purpose: Kotoba word progression logic. Words unlock in steps
//          of 6, flowing continuously through all levels.
//          First 6 words always unlocked. Master all 6 (score 5+)
//          to unlock the next 6. Pure functions only.
// Depends on: engine/constants.ts, types/word.types.ts
// ------------------------------------------------------------

import { UNLOCK_THRESHOLD } from '@/engine/constants'
import type { WordMasteryScoreMap } from '@/types/word.types'

// ── Constants ───────────────────────────────

export const KOTOBA_STEP_SIZE = 6

// ── Helpers ─────────────────────────────────

function getStepWordIds(allWordIds: readonly string[], stepIndex: number): readonly string[] {
  const start = stepIndex * KOTOBA_STEP_SIZE
  if (start >= allWordIds.length) return []
  return allWordIds.slice(start, start + KOTOBA_STEP_SIZE)
}

function getStepCount(allWordIds: readonly string[]): number {
  return Math.ceil(allWordIds.length / KOTOBA_STEP_SIZE)
}

// ── Step completion ─────────────────────────

export function isKotobaStepComplete(
  stepIndex: number,
  allWordIds: readonly string[],
  wordScores: WordMasteryScoreMap,
): boolean {
  const stepWords = getStepWordIds(allWordIds, stepIndex)
  if (stepWords.length === 0) return false
  return stepWords.every((id) => (wordScores[id] ?? 0) >= UNLOCK_THRESHOLD)
}

// ── Step unlock ─────────────────────────────

export function isKotobaStepUnlocked(
  stepIndex: number,
  allWordIds: readonly string[],
  wordScores: WordMasteryScoreMap,
  manuallyUnlockedWordIds: Set<string>,
): boolean {
  const totalSteps = getStepCount(allWordIds)
  if (stepIndex < 0 || stepIndex >= totalSteps) return false
  if (stepIndex === 0) return true

  const stepWords = getStepWordIds(allWordIds, stepIndex)
  if (stepWords.every((id) => manuallyUnlockedWordIds.has(id))) return true

  return isKotobaStepComplete(stepIndex - 1, allWordIds, wordScores)
}

// ── Active step ─────────────────────────────

export function getActiveKotobaStepIndex(
  allWordIds: readonly string[],
  wordScores: WordMasteryScoreMap,
  manuallyUnlockedWordIds: Set<string>,
): number | null {
  const totalSteps = getStepCount(allWordIds)
  for (let i = 0; i < totalSteps; i++) {
    if (
      isKotobaStepUnlocked(i, allWordIds, wordScores, manuallyUnlockedWordIds) &&
      !isKotobaStepComplete(i, allWordIds, wordScores)
    ) {
      return i
    }
  }
  return null
}

// ── Unlocked words ──────────────────────────

export function getUnlockedKotobaWordIds(
  allWordIds: readonly string[],
  wordScores: WordMasteryScoreMap,
  manuallyUnlockedWordIds: Set<string>,
): Set<string> {
  const result = new Set<string>()
  const totalSteps = getStepCount(allWordIds)
  for (let i = 0; i < totalSteps; i++) {
    if (isKotobaStepUnlocked(i, allWordIds, wordScores, manuallyUnlockedWordIds)) {
      for (const id of getStepWordIds(allWordIds, i)) {
        result.add(id)
      }
    }
  }
  return result
}
