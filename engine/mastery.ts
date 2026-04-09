// ─────────────────────────────────────────────
// File: engine/mastery.ts
// Purpose: Mastery score logic and frequency weighting.
//          Computes heat class for display and selection weight from score.
//          Pure functions only. No side effects.
// Depends on: types/kana.types.ts
// ─────────────────────────────────────────────

import type { MasteryScore } from '@/types/kana.types'

// ── Heat class ────────────────────────────────

// Returns a Tailwind bg token for the mastery heat colour.
// Token maps to CSS variables defined in app/globals.css.
// Components apply the class directly - they never compute colours themselves.
export function getMasteryHeatClass(score: MasteryScore): string {
  if (score === 0) return 'bg-heat-0'
  if (score <= 4) return 'bg-heat-1'
  if (score <= 9) return 'bg-heat-2'
  if (score <= 19) return 'bg-heat-3'
  if (score <= 39) return 'bg-heat-4'
  return 'bg-heat-5'
}

// ── Frequency weight ──────────────────────────

// Returns the selection weight for a character with the given mastery score.
// Formula: 1 / (score + 1). Lower scores produce higher weights so characters
// that need more practice appear more often in the selection draw.
export function getMasteryWeight(score: MasteryScore): number {
  return 1 / (score + 1)
}
