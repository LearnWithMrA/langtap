// ─────────────────────────────────────────────
// File: data/words/kotoba-levels.ts
// Purpose: Aggregates all Kotoba level definitions from per-JLPT files.
//          Each level contains exactly 12 word IDs grouped by theme.
//          See docs/CONTENT.md Section 11 for design principles.
//          Level files are being rebuilt with categorise-first workflow.
//          Re-add imports as each level file is completed.
// Depends on: data/words/kotoba-levels/
// ─────────────────────────────────────────────

// ── Re-exports ───────────────────────────────

export type { KotobaLevel, KotobaLevelSet } from './kotoba-levels/types'

export const KOTOBA_LEVELS = [] as const
