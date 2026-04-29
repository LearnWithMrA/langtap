// ------------------------------------------------------------
// File: engine/counter.ts
// Purpose: Word counter logic. Tracks how many times a word has been
//          shown. Resets when all words for a character reach the cap.
//          Pure functions only. No side effects. No mutation of inputs.
// Depends on: engine/constants.ts, types/word.types.ts
// ------------------------------------------------------------

import { MAX_WORD_COUNTER } from '@/engine/constants'
import type { WordCounterMap } from '@/types/word.types'

// ── Helpers ──────────────────────────────────

// Counter invariant: finite integer in 0..MAX_WORD_COUNTER.
// Positive Infinity clamps to MAX (very high = maxed out).
// NaN and negative values clamp to 0.
export function sanitizeCounter(value: number): number {
  if (value === Infinity) return MAX_WORD_COUNTER
  if (!Number.isFinite(value) || value < 0) return 0
  return Math.min(Math.floor(value), MAX_WORD_COUNTER)
}

// Two-sided clamp for weight calculation.
function clampCounter(counter: number): number {
  if (counter === Infinity) return MAX_WORD_COUNTER
  if (!Number.isFinite(counter) || counter < 0) return 0
  return Math.min(counter, MAX_WORD_COUNTER)
}

// ── Main exports ─────────────────────────────

// Returns a new counter map with the word's counter incremented by 1,
// capped at MAX_WORD_COUNTER. Does not mutate the input.
export function incrementWordCounter(counters: WordCounterMap, wordId: string): WordCounterMap {
  const current = counters[wordId] ?? 0
  return { ...counters, [wordId]: Math.min(current + 1, MAX_WORD_COUNTER) }
}

// Returns true if every word in the list has counter >= MAX_WORD_COUNTER.
// Returns false for empty arrays (domain safety guard).
export function shouldResetCounters(
  counters: WordCounterMap,
  wordIdsForCharacter: string[],
): boolean {
  if (wordIdsForCharacter.length === 0) return false
  return wordIdsForCharacter.every((id) => (counters[id] ?? 0) >= MAX_WORD_COUNTER)
}

// Returns a new counter map with the specified word IDs reset to 0.
// Only modifies existing keys. Does not create entries for unknown IDs.
// Does not mutate the input.
export function resetCountersForCharacter(
  counters: WordCounterMap,
  wordIdsForCharacter: string[],
): WordCounterMap {
  const result = { ...counters }
  for (const id of wordIdsForCharacter) {
    if (id in result) {
      result[id] = 0
    }
  }
  return result
}

// Returns a selection weight for a word based on its counter.
// Lower counter = higher weight = more likely to be selected.
// Formula: MAX_WORD_COUNTER - clamp(counter) + 1
export function getWordCounterWeight(counter: number): number {
  return MAX_WORD_COUNTER - clampCounter(counter) + 1
}
