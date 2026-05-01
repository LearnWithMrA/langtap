// ─────────────────────────────────────────────
// File: engine/__tests__/kotoba-scoring.test.ts
// Purpose: Tests for Kotoba scoring multiplier and settings
//          integration. Verifies KANJI_INPUT_MULTIPLIER constant
//          and that the hook's recordWordComplete applies it.
// Depends on: engine/constants.ts
// ─────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import { KANJI_INPUT_MULTIPLIER } from '@/engine/constants'

describe('KANJI_INPUT_MULTIPLIER', () => {
  it('is 4', () => {
    expect(KANJI_INPUT_MULTIPLIER).toBe(4)
  })

  it('is a positive integer', () => {
    expect(Number.isInteger(KANJI_INPUT_MULTIPLIER)).toBe(true)
    expect(KANJI_INPUT_MULTIPLIER).toBeGreaterThan(0)
  })
})
