// ─────────────────────────────────────────────
// File: data/words/kotoba-levels.ts
// Purpose: Aggregates all Kotoba level definitions from per-JLPT files.
//          Each level contains 12 word IDs (last level may have fewer).
//          Built from categories by scripts/build-kotoba-levels.ts.
//          See docs/CONTENT.md Section 11 for design principles.
// Depends on: data/words/kotoba-levels/
// ─────────────────────────────────────────────

import { N5_LEVELS } from './kotoba-levels/n5'
import { N4_LEVELS } from './kotoba-levels/n4'
import { N3_LEVELS } from './kotoba-levels/n3'
import { N2_LEVELS } from './kotoba-levels/n2'
import { N1_LEVELS } from './kotoba-levels/n1'

// ── Re-exports ───────────────────────────────

export type { KotobaLevel, KotobaLevelSet } from './kotoba-levels/types'

export { N5_LEVELS, N4_LEVELS, N3_LEVELS, N2_LEVELS, N1_LEVELS }

export const KOTOBA_LEVELS = [
  { jlpt: 'n5' as const, levels: N5_LEVELS },
  { jlpt: 'n4' as const, levels: N4_LEVELS },
  { jlpt: 'n3' as const, levels: N3_LEVELS },
  { jlpt: 'n2' as const, levels: N2_LEVELS },
  { jlpt: 'n1' as const, levels: N1_LEVELS },
] as const
