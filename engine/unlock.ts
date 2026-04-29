// ------------------------------------------------------------
// File: engine/unlock.ts
// Purpose: Unlock threshold check, word eligibility, and guided
//          progression sequence. Determines which characters are
//          unlocked and which group is currently active.
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
