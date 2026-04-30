// ─────────────────────────────────────────────
// File: data/words/kotoba-levels.ts
// Purpose: Aggregates all Kotoba level definitions from per-JLPT files.
//          Each level contains exactly 12 word IDs grouped by theme.
//          See docs/CONTENT.md Section 11 for design principles.
// Depends on: data/words/kotoba-levels/
// ─────────────────────────────────────────────

import { N5_LEVELS } from './kotoba-levels/n5'
import { N4_LEVELS } from './kotoba-levels/n4'

// ── Re-exports ───────────────────────────────

export type { KotobaLevel, KotobaLevelSet } from './kotoba-levels/types'

export { N5_LEVELS, N4_LEVELS }

export const KOTOBA_LEVELS = [
  { jlpt: 'n5' as const, levels: N5_LEVELS },
  { jlpt: 'n4' as const, levels: N4_LEVELS },
] as const
