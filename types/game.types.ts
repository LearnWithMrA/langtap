// ------------------------------------------------------------
// File: types/game.types.ts
// Purpose: TypeScript type definitions for game state, mastery maps,
//          and unlock state. Used by the game engine, stores, and hooks.
// Depends on: nothing
// ------------------------------------------------------------

// ── Mastery ──────────────────────────────────

/**
 * Map of character ID to mastery score.
 * Score is a non-negative integer with no upper bound.
 * A higher score means the character is better known.
 */
export type MasteryScoreMap = Record<string, number>

/**
 * A character paired with its current mastery score.
 * Used as input to the selection algorithm.
 */
export type CharacterWithMastery = {
  id: string
  masteryScore: number
}

// ── Unlock ───────────────────────────────────

/**
 * How a character was unlocked. Reflects current state, not historical
 * first-unlock attribution. Both conditions can be true simultaneously.
 *
 * 'mastery'            - reached UNLOCK_THRESHOLD correct answers via practice
 * 'manual'             - unlocked during onboarding or from the Dojo screen
 * 'mastery_and_manual' - both conditions are currently true
 */
export type UnlockSource = 'mastery' | 'manual' | 'mastery_and_manual'

// ── State shapes ────────────────────────────

/**
 * Serialisable mastery state. Uses plain string[] (not Set) so the shape
 * can cross the Next.js server/client boundary without serialisation warnings.
 */
export type MasteryState = {
  scores: Readonly<Record<string, number>>
  manuallyUnlocked: readonly string[]
}
