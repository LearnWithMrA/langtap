// ─────────────────────────────────────────────
// File: engine/input.ts
// Purpose: Tri-state input evaluation for the practice screen.
//          Compares user input against the expected answer and returns
//          full_match, prefix_match, or no_match. Pure function, no
//          side effects. Plan 3 (romaji variants) extends this by
//          providing alternate expected strings.
// Depends on: nothing
// ─────────────────────────────────────────────

// ── Types ─────────────────────────────────────

export type InputMatchResult = 'full_match' | 'prefix_match' | 'no_match'

// ── Main export ───────────────────────────────

export function evaluateInput(input: string, expected: string): InputMatchResult {
  if (input === expected) return 'full_match'
  if (expected.startsWith(input)) return 'prefix_match'
  return 'no_match'
}
