// ------------------------------------------------------------
// File: engine/unlock.ts
// Purpose: Unlock threshold check, word eligibility, guided
//          progression sequence, and auto-progression logic.
//          Determines which characters are unlocked, which group
//          is active, and when the next group should auto-unlock.
//          Pure functions only. No side effects.
// Depends on: engine/constants.ts, types/game.types.ts, types/kana.types.ts
// ------------------------------------------------------------

import { UNLOCK_THRESHOLD } from '@/engine/constants'
import type { MasteryScoreMap, UnlockSource } from '@/types/game.types'
import type { ProgressionGroup } from '@/types/kana.types'

// ── Helpers ──────────────────────────────────

// Normalizes a score for unlock evaluation.
// Non-finite or negative values are treated as 0 (locked).
function safeScore(scores: MasteryScoreMap, characterId: string): number {
  const raw = scores[characterId] ?? 0
  return Number.isFinite(raw) && raw >= 0 ? raw : 0
}

// ── Unlock checks ────────────────────────────

// A character is unlocked if its mastery score >= UNLOCK_THRESHOLD
// OR it was manually unlocked (onboarding / Dojo).
// Manual unlocks bypass progression stage constraints entirely.
export function isCharacterUnlocked(
  characterId: string,
  masteryScores: MasteryScoreMap,
  manualUnlocks: Set<string>,
): boolean {
  if (safeScore(masteryScores, characterId) >= UNLOCK_THRESHOLD) return true
  if (manualUnlocks.has(characterId)) return true
  return false
}

// A word is eligible only if EVERY character in it is unlocked.
// Returns false for empty arrays (malformed data guard).
export function isWordEligible(
  wordCharacterIds: string[],
  masteryScores: MasteryScoreMap,
  manualUnlocks: Set<string>,
): boolean {
  if (wordCharacterIds.length === 0) return false
  return wordCharacterIds.every((id) => isCharacterUnlocked(id, masteryScores, manualUnlocks))
}

// Thin wrapper for callers that already have a precomputed unlocked set.
// Used by the selection algorithm to avoid recomputing unlock status per word.
export function isWordEligibleByUnlockedSet(
  wordCharacterIds: string[],
  unlockedIds: Set<string>,
): boolean {
  if (wordCharacterIds.length === 0) return false
  return wordCharacterIds.every((id) => unlockedIds.has(id))
}

// Returns the full set of currently unlocked character IDs.
// Only IDs present in allCharacterIds are included (strict dataset contract).
// Manual unlock IDs not in the dataset are ignored.
export function getUnlockedCharacterIds(
  allCharacterIds: string[],
  masteryScores: MasteryScoreMap,
  manualUnlocks: Set<string>,
): Set<string> {
  const result = new Set<string>()
  for (const id of allCharacterIds) {
    if (isCharacterUnlocked(id, masteryScores, manualUnlocks)) {
      result.add(id)
    }
  }
  return result
}

// Reflects current unlock state, not historical first-unlock attribution.
// Returns null if the character is not unlocked at all.
export function getUnlockSource(
  characterId: string,
  masteryScores: MasteryScoreMap,
  manualUnlocks: Set<string>,
): UnlockSource | null {
  const hasMastery = safeScore(masteryScores, characterId) >= UNLOCK_THRESHOLD
  const hasManual = manualUnlocks.has(characterId)

  if (hasMastery && hasManual) return 'mastery_and_manual'
  if (hasMastery) return 'mastery'
  if (hasManual) return 'manual'
  return null
}

// ── Progression sequence ─────────────────────

// Returns true if every character in the group is in the unlocked set.
// Checks unlock state only, not unlock source. A group completed via
// manual unlock and a group completed via mastery practice are identical.
// If source-aware completion is needed later, add isGroupMastered()
// that checks scores only, ignoring manual unlocks.
export function isGroupComplete(group: ProgressionGroup, unlockedIds: Set<string>): boolean {
  return group.characterIds.every((id) => unlockedIds.has(id))
}

// Returns the first group in the ordered progression where not all
// characters are unlocked. This is the group the guided progression
// is currently working through. Returns null if all groups are complete.
//
// Active group controls the Dojo's "currently working on" indicator
// and determines which characters auto-unlock next via practice.
// It does NOT restrict the selection pool. All unlocked characters
// are eligible for practice regardless of group.
export function getActiveGroup(
  progressionGroups: readonly ProgressionGroup[],
  unlockedIds: Set<string>,
): ProgressionGroup | null {
  return progressionGroups.find((group) => !isGroupComplete(group, unlockedIds)) ?? null
}

// Returns the character IDs of the currently active group.
// Empty array if all groups are complete.
export function getActiveCharacterIds(
  progressionGroups: readonly ProgressionGroup[],
  unlockedIds: Set<string>,
): readonly string[] {
  const active = getActiveGroup(progressionGroups, unlockedIds)
  return active ? active.characterIds : []
}

// Total completed groups (may be non-contiguous if manual unlocks skip ahead).
export function getCompletedGroupCount(
  progressionGroups: readonly ProgressionGroup[],
  unlockedIds: Set<string>,
): number {
  return progressionGroups.filter((group) => isGroupComplete(group, unlockedIds)).length
}

// Consecutive completed groups from the start. Stops at the first
// incomplete group. Better reflects linear progression advancement
// than getCompletedGroupCount for UI display.
export function getContiguousCompletedCount(
  progressionGroups: readonly ProgressionGroup[],
  unlockedIds: Set<string>,
): number {
  let count = 0
  for (const group of progressionGroups) {
    if (!isGroupComplete(group, unlockedIds)) break
    count++
  }
  return count
}

// ── Auto-progression ────────────────────────

// Returns true when every unlocked character has reached mastery
// threshold. This is the trigger for auto-unlocking the next group.
// An empty unlocked set returns false (nothing to progress from).
export function isReadyToProgress(
  unlockedIds: Set<string>,
  masteryScores: MasteryScoreMap,
): boolean {
  if (unlockedIds.size === 0) return false
  for (const id of unlockedIds) {
    if (safeScore(masteryScores, id) < UNLOCK_THRESHOLD) return false
  }
  return true
}

// Finds the current unlock step index based on which steps are
// already complete. A step is complete when all groups in it have
// all their characters unlocked. Returns the index of the first
// incomplete step, or null if all steps are done.
export function getCurrentStepIndex(
  progressionGroups: readonly ProgressionGroup[],
  unlockSteps: readonly (readonly number[])[],
  unlockedIds: Set<string>,
): number | null {
  for (let i = 0; i < unlockSteps.length; i++) {
    const step = unlockSteps[i]
    const stepComplete = step.every((groupIdx) => {
      const group = progressionGroups[groupIdx]
      return group && isGroupComplete(group, unlockedIds)
    })
    if (!stepComplete) return i
  }
  return null
}

// Returns the character IDs that should be unlocked in the next
// progression step. Returns an empty array if all steps are done
// or the player is not ready to progress.
// Callers should add these IDs to the manual unlock set.
export function getNextUnlockIds(
  progressionGroups: readonly ProgressionGroup[],
  unlockSteps: readonly (readonly number[])[],
  unlockedIds: Set<string>,
): readonly string[] {
  const stepIndex = getCurrentStepIndex(progressionGroups, unlockSteps, unlockedIds)
  if (stepIndex === null) return []

  const step = unlockSteps[stepIndex]
  const ids: string[] = []
  for (const groupIdx of step) {
    const group = progressionGroups[groupIdx]
    if (!group) continue
    for (const id of group.characterIds) {
      if (!unlockedIds.has(id)) ids.push(id)
    }
  }
  return ids
}
