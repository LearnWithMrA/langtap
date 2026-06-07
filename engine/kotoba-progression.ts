// ------------------------------------------------------------
// File: engine/kotoba-progression.ts
// Purpose: Kotoba word progression logic. Words unlock in steps
//          of 6, flowing continuously through all levels. Step 0
//          unlocks only for JLPT levels at or below the user's
//          selection. Master all 6 (score 3+) to unlock the next
//          6. Pure functions only.
// Depends on: engine/constants.ts, types/word.types.ts
// ------------------------------------------------------------

import { KOTOBA_UNLOCK_THRESHOLD, KOTOBA_MASTERY_THRESHOLD } from '@/engine/constants'
import type { WordMasteryScoreMap } from '@/types/word.types'

// ── JLPT ordering ──────────────────────────

export const JLPT_RANK: Record<string, number> = { N5: 0, N4: 1, N3: 2, N2: 3, N1: 4 }

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
  return stepWords.every((id) => (wordScores[id] ?? 0) >= KOTOBA_UNLOCK_THRESHOLD)
}

// ── Step unlock ─────────────────────────────

export function isKotobaStepUnlocked(
  stepIndex: number,
  allWordIds: readonly string[],
  wordScores: WordMasteryScoreMap,
  manuallyUnlockedWordIds: Set<string>,
  step0Unlocked: boolean = true,
): boolean {
  const totalSteps = getStepCount(allWordIds)
  if (stepIndex < 0 || stepIndex >= totalSteps) return false
  if (stepIndex === 0) return step0Unlocked

  const stepWords = getStepWordIds(allWordIds, stepIndex)
  if (stepWords.every((id) => manuallyUnlockedWordIds.has(id))) return true

  return isKotobaStepComplete(stepIndex - 1, allWordIds, wordScores)
}

// ── Active step ─────────────────────────────

export function getActiveKotobaStepIndex(
  allWordIds: readonly string[],
  wordScores: WordMasteryScoreMap,
  manuallyUnlockedWordIds: Set<string>,
  step0Unlocked: boolean = true,
): number | null {
  const totalSteps = getStepCount(allWordIds)
  for (let i = 0; i < totalSteps; i++) {
    if (
      isKotobaStepUnlocked(i, allWordIds, wordScores, manuallyUnlockedWordIds, step0Unlocked) &&
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
  step0Unlocked: boolean = true,
): Set<string> {
  const result = new Set<string>()
  const totalSteps = getStepCount(allWordIds)
  for (let i = 0; i < totalSteps; i++) {
    if (isKotobaStepUnlocked(i, allWordIds, wordScores, manuallyUnlockedWordIds, step0Unlocked)) {
      for (const id of getStepWordIds(allWordIds, i)) {
        result.add(id)
      }
    }
  }
  return result
}

// ── Auto-mastery for JLPT level selection ───

export function buildAutoMasteryScores(
  selectedLevel: string,
  levelWordIds: Record<string, readonly string[]>,
): WordMasteryScoreMap {
  const selectedRank = JLPT_RANK[selectedLevel] ?? 0
  const scores: WordMasteryScoreMap = {}

  for (const [level, wordIds] of Object.entries(levelWordIds)) {
    const rank = JLPT_RANK[level] ?? 0
    if (rank < selectedRank) {
      for (const id of wordIds) {
        scores[id] = KOTOBA_MASTERY_THRESHOLD
      }
    }
  }

  return scores
}
