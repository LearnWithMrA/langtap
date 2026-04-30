// ─────────────────────────────────────────────
// File: data/words/kotoba-levels/types.ts
// Purpose: Shared types for Kotoba level definitions.
// ─────────────────────────────────────────────

import type { JlptLevel } from '@/types/kotoba.types'

// ── Types ─────────────────────────────────────

export type KotobaLevel = {
  wordIds: readonly string[]
}

export type KotobaLevelSet = {
  jlpt: JlptLevel
  levels: readonly KotobaLevel[]
}
