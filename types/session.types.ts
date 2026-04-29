// ------------------------------------------------------------
// File: types/session.types.ts
// Purpose: TypeScript type definitions for session score, prompt
//          results, and selection output. Used by engine and stores.
// Depends on: types/word.types.ts
// ------------------------------------------------------------

import type { WordBankEntry, WordCounterMap } from '@/types/word.types'

// ── Prompt ───────────────────────────────────

/**
 * The result of the selection algorithm for a single prompt.
 * Contains everything the practice screen needs to display one round.
 */
export type PromptResult = {
  characterId: string
  word: WordBankEntry
}

/**
 * Full output of selectNextPrompt, including any counter state changes
 * caused by resets during word selection. The caller is responsible for
 * persisting updatedCounters to the counter store.
 */
export type SelectionResult = {
  prompt: PromptResult
  updatedCounters: WordCounterMap
}

// ── Session ──────────────────────────────────

/**
 * Running statistics for the current practice session.
 * Resets at the start of every new session.
 */
export type SessionScore = {
  correctAnswers: number
  wrongAnswers: number
  distanceMetres: number
  durationSeconds: number
  charactersEncountered: Set<string>
}
