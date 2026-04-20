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

// ── Mastery threshold ─────────────────────────

// Score at which a character enters the "mastered" visual state. Matches the
// lower bound of the bg-heat-5 band (40+) per FRONTEND.md §2.1. In the Dojo,
// a mastered tile swaps from the neutral surface to a dark + gold badge
// style; see CharacterTile for the rendering.
export const MASTERY_THRESHOLD = 40

// Returns true when the character should render in the mastered visual state.
export function isMastered(score: MasteryScore): boolean {
  return score >= MASTERY_THRESHOLD
}

// Tailwind class literal used for the "gold" accent wherever a mastered
// state needs to render on the page. Centralised here so consumers can
// compose it rather than duplicating the arbitrary value syntax.
export const HEAT_GOLD_BG = 'bg-[color:var(--color-heat-gold)]'

// ── Progress bar fill class ───────────────────

// Returns the Tailwind bg class that should fill a progress bar (inside a
// tile or a group-level bar) for a given score. Mirrors getMasteryHeatClass
// across bands 0-4, then switches to the gold accent once score reaches
// MASTERY_THRESHOLD. This keeps tile fills and group-bar fills driven by a
// single source of truth.
export function progressBarFillClass(score: MasteryScore): string {
  if (score >= MASTERY_THRESHOLD) return HEAT_GOLD_BG
  return getMasteryHeatClass(score)
}

// Convenience wrapper for group-level bars that carry a percentage rather
// than a raw score. Converts the percentage into an equivalent score on the
// 0..MASTERY_THRESHOLD scale and reuses progressBarFillClass.
export function progressBarFillClassFromPercent(percent: number): string {
  const clamped = Math.max(0, Math.min(100, percent))
  const equivalent = Math.round((clamped / 100) * MASTERY_THRESHOLD)
  return progressBarFillClass(equivalent)
}

// ── Border colour by score ────────────────────

// Returns the Tailwind border-colour class to apply to a tile outline based
// on the character's current mastery score. Ramps through the heatmap
// palette (see globals.css) and switches to the gold accent at or above
// MASTERY_THRESHOLD. Class names are literal strings so Tailwind's scanner
// can generate them.
//
// The Dojo tile uses an asymmetric border (3px sides, 6px bottom) for its
// 3D keyboard-key look; a single border-colour class sets every side. The
// bottom width is controlled separately via Tailwind's `border-b-[Npx]`.
export function progressBarBorderClass(score: MasteryScore): string {
  if (score >= MASTERY_THRESHOLD) return 'border-[color:var(--color-heat-gold)]'
  if (score === 0) return 'border-heat-0'
  if (score <= 4) return 'border-heat-1'
  if (score <= 9) return 'border-heat-2'
  if (score <= 19) return 'border-heat-3'
  if (score <= 39) return 'border-heat-4'
  return 'border-heat-5'
}

// ── Frequency weight ──────────────────────────

// Returns the selection weight for a character with the given mastery score.
// Formula: 1 / (score + 1). Lower scores produce higher weights so characters
// that need more practice appear more often in the selection draw.
export function getMasteryWeight(score: MasteryScore): number {
  return 1 / (score + 1)
}
