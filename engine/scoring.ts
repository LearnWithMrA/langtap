// ------------------------------------------------------------
// File: engine/scoring.ts
// Purpose: Per-character first-attempt scoring logic.
//          Determines whether a character attempt earns a mastery point.
//          Input correctness is pre-resolved upstream by the game loop.
//          This function receives a boolean, not raw text.
//          Pure functions only. No side effects.
// Depends on: nothing
// ------------------------------------------------------------

// ── Main exports ─────────────────────────────

// Returns 1 if this is the first attempt AND correct, 0 otherwise.
export function evaluateCharacterAttempt(isFirstAttempt: boolean, isCorrect: boolean): number {
  return isFirstAttempt && isCorrect ? 1 : 0
}

// Evaluates all character results for a completed word.
// Per unique character ID: earn at most 1 point if ANY first-attempt-correct
// occurrence exists. Uses max() across duplicate character IDs.
export function evaluateWordResult(
  characterResults: Array<{
    characterId: string
    isFirstAttemptCorrect: boolean
  }>,
): Record<string, number> {
  const increments: Record<string, number> = {}
  for (const result of characterResults) {
    const current = increments[result.characterId] ?? 0
    increments[result.characterId] = Math.max(current, result.isFirstAttemptCorrect ? 1 : 0)
  }
  return increments
}
