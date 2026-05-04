// ─────────────────────────────────────────────
// File: engine/practice-eligibility.ts
// Purpose: Builds the three character sets that drive the kana
//          learning phase. Pure functions only.
//
//          practiceAvailable: characters the player can drill
//          wordEligible: characters that can appear in words
//          dojoUnlocked: characters shown as unlocked in the dojo
//
//          Learning scores (0-5) are separate from mastery scores.
//          Learning scores unlock characters. Mastery scores drive
//          the heatmap and only come from word practice.
// Depends on: engine/constants.ts, types/game.types.ts
// ─────────────────────────────────────────────

import { KANA_WORD_ELIGIBLE_THRESHOLD } from '@/engine/constants'
import type { MasteryScoreMap } from '@/types/game.types'
import type { ProgressionGroup } from '@/types/kana.types'

// ── Constants ─────────────────────────────────

const ALWAYS_UNLOCKED = new Set(['h-sokuon', 'k-sokuon', 'k-longvowel'])
const SOLO_DRILL_EXCLUDED = new Set(['h-sokuon', 'k-sokuon', 'k-longvowel'])

// ── Helpers ───────────────────────────────────

function isStepComplete(
  stepGroupIndexes: readonly number[],
  groups: readonly ProgressionGroup[],
  learningScores: MasteryScoreMap,
  manualUnlocks: ReadonlySet<string>,
): boolean {
  for (const groupIdx of stepGroupIndexes) {
    const group = groups[groupIdx]
    if (!group) return false
    for (const charId of group.characterIds) {
      if (ALWAYS_UNLOCKED.has(charId)) continue
      if (manualUnlocks.has(charId)) continue
      const score = learningScores[charId] ?? 0
      if (score < KANA_WORD_ELIGIBLE_THRESHOLD) return false
    }
  }
  return true
}

// ── Main exports ──────────────────────────────

export function getPracticeAvailableIds(
  learningScores: MasteryScoreMap,
  manualUnlocks: ReadonlySet<string>,
  groups: readonly ProgressionGroup[],
  steps: readonly (readonly number[])[],
): Set<string> {
  const ids = new Set<string>()

  for (const id of ALWAYS_UNLOCKED) ids.add(id)
  for (const id of manualUnlocks) ids.add(id)

  for (let i = 0; i < steps.length; i++) {
    if (i > 0 && !isStepComplete(steps[i - 1], groups, learningScores, manualUnlocks)) break
    for (const groupIdx of steps[i]) {
      const group = groups[groupIdx]
      if (group) {
        for (const charId of group.characterIds) ids.add(charId)
      }
    }
  }

  return ids
}

export function getWordEligibleIds(
  learningScores: MasteryScoreMap,
  manualUnlocks: ReadonlySet<string>,
): Set<string> {
  const ids = new Set<string>()

  for (const id of ALWAYS_UNLOCKED) ids.add(id)
  for (const id of manualUnlocks) ids.add(id)

  for (const [charId, score] of Object.entries(learningScores)) {
    if (score >= KANA_WORD_ELIGIBLE_THRESHOLD) ids.add(charId)
  }

  return ids
}

export function getDojoUnlockedIds(
  learningScores: MasteryScoreMap,
  manualUnlocks: ReadonlySet<string>,
): Set<string> {
  return getWordEligibleIds(learningScores, manualUnlocks)
}

export function getSoloDrillPool(practiceIds: Set<string>): Set<string> {
  const pool = new Set(practiceIds)
  for (const id of SOLO_DRILL_EXCLUDED) pool.delete(id)
  return pool
}

export function countEligibleWords(
  wordEligibleIds: Set<string>,
  wordBank: readonly { characterIds: readonly string[] }[],
): number {
  let count = 0
  for (const word of wordBank) {
    if (word.characterIds.every((id) => wordEligibleIds.has(id))) count++
  }
  return count
}
