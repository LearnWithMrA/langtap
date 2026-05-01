// ------------------------------------------------------------
// File: engine/__tests__/kotoba-progression.test.ts
// Purpose: Tests for Kotoba word progression logic.
//          Covers: step completion, step unlock, active step,
//          unlocked word IDs, and manual unlock behaviour.
// Depends on: engine/kotoba-progression.ts
// ------------------------------------------------------------

import { describe, it, expect } from 'vitest'
import {
  isKotobaStepComplete,
  isKotobaStepUnlocked,
  getActiveKotobaStepIndex,
  getUnlockedKotobaWordIds,
  buildAutoMasteryScores,
  KOTOBA_STEP_SIZE,
} from '@/engine/kotoba-progression'
import { KOTOBA_MASTERY_THRESHOLD } from '@/engine/constants'

// ── Fixtures ────────────────────────────────

const WORDS: readonly string[] = [
  'w1',
  'w2',
  'w3',
  'w4',
  'w5',
  'w6',
  'w7',
  'w8',
  'w9',
  'w10',
  'w11',
  'w12',
  'w13',
  'w14',
  'w15',
  'w16',
]

const EMPTY_MANUAL = new Set<string>()

// ── KOTOBA_STEP_SIZE ────────────────────────

describe('KOTOBA_STEP_SIZE', () => {
  it('is 6', () => {
    expect(KOTOBA_STEP_SIZE).toBe(6)
  })
})

// ── isKotobaStepComplete ────────────────────

describe('isKotobaStepComplete', () => {
  it('returns false when no words have scores', () => {
    expect(isKotobaStepComplete(0, WORDS, {})).toBe(false)
  })

  it('returns false when some words in the step are below threshold', () => {
    const scores = { w1: 3, w2: 3, w3: 3, w4: 3, w5: 3, w6: 2 }
    expect(isKotobaStepComplete(0, WORDS, scores)).toBe(false)
  })

  it('returns true when all words in step 0 are at threshold', () => {
    const scores = { w1: 3, w2: 3, w3: 3, w4: 3, w5: 3, w6: 3 }
    expect(isKotobaStepComplete(0, WORDS, scores)).toBe(true)
  })

  it('checks the correct slice for step 1', () => {
    const scores = { w7: 3, w8: 3, w9: 3, w10: 3, w11: 3, w12: 3 }
    expect(isKotobaStepComplete(1, WORDS, scores)).toBe(true)
  })

  it('handles a final step smaller than 6', () => {
    const scores = { w13: 3, w14: 3, w15: 3, w16: 3 }
    expect(isKotobaStepComplete(2, WORDS, scores)).toBe(true)
  })

  it('returns false for out-of-bounds step', () => {
    expect(isKotobaStepComplete(99, WORDS, {})).toBe(false)
  })
})

// ── isKotobaStepUnlocked ────────────────────

describe('isKotobaStepUnlocked', () => {
  it('step 0 is always unlocked', () => {
    expect(isKotobaStepUnlocked(0, WORDS, {}, EMPTY_MANUAL)).toBe(true)
  })

  it('step 1 is locked when step 0 is incomplete', () => {
    expect(isKotobaStepUnlocked(1, WORDS, {}, EMPTY_MANUAL)).toBe(false)
  })

  it('step 1 unlocks when step 0 is complete', () => {
    const scores = { w1: 3, w2: 3, w3: 3, w4: 3, w5: 3, w6: 3 }
    expect(isKotobaStepUnlocked(1, WORDS, scores, EMPTY_MANUAL)).toBe(true)
  })

  it('step 2 requires step 1 complete', () => {
    const scores = { w1: 3, w2: 3, w3: 3, w4: 3, w5: 3, w6: 3 }
    expect(isKotobaStepUnlocked(2, WORDS, scores, EMPTY_MANUAL)).toBe(false)
  })

  it('manual unlock bypasses progression', () => {
    const manual = new Set(['w13', 'w14', 'w15', 'w16'])
    expect(isKotobaStepUnlocked(2, WORDS, {}, manual)).toBe(true)
  })

  it('manual unlock requires all words in step to be manually unlocked', () => {
    const manual = new Set(['w13', 'w14'])
    expect(isKotobaStepUnlocked(2, WORDS, {}, manual)).toBe(false)
  })

  it('returns false for out-of-bounds step', () => {
    expect(isKotobaStepUnlocked(99, WORDS, {}, EMPTY_MANUAL)).toBe(false)
  })

  it('returns false for negative step', () => {
    expect(isKotobaStepUnlocked(-1, WORDS, {}, EMPTY_MANUAL)).toBe(false)
  })
})

// ── getActiveKotobaStepIndex ────────────────

describe('getActiveKotobaStepIndex', () => {
  it('returns 0 when no progress', () => {
    expect(getActiveKotobaStepIndex(WORDS, {}, EMPTY_MANUAL)).toBe(0)
  })

  it('returns 1 when step 0 is complete', () => {
    const scores = { w1: 3, w2: 3, w3: 3, w4: 3, w5: 3, w6: 3 }
    expect(getActiveKotobaStepIndex(WORDS, scores, EMPTY_MANUAL)).toBe(1)
  })

  it('returns null when all steps are complete', () => {
    const scores: Record<string, number> = {}
    for (const w of WORDS) scores[w] = 3
    expect(getActiveKotobaStepIndex(WORDS, scores, EMPTY_MANUAL)).toBeNull()
  })

  it('returns first incomplete step even with manual unlocks ahead', () => {
    const manual = new Set(['w13', 'w14', 'w15', 'w16'])
    expect(getActiveKotobaStepIndex(WORDS, {}, manual)).toBe(0)
  })

  it('returns null for empty word list', () => {
    expect(getActiveKotobaStepIndex([], {}, EMPTY_MANUAL)).toBeNull()
  })
})

// ── getUnlockedKotobaWordIds ────────────────

describe('getUnlockedKotobaWordIds', () => {
  it('returns only step 0 words when no progress', () => {
    const result = getUnlockedKotobaWordIds(WORDS, {}, EMPTY_MANUAL)
    expect(result).toEqual(new Set(['w1', 'w2', 'w3', 'w4', 'w5', 'w6']))
  })

  it('returns step 0 and 1 words when step 0 is complete', () => {
    const scores = { w1: 3, w2: 3, w3: 3, w4: 3, w5: 3, w6: 3 }
    const result = getUnlockedKotobaWordIds(WORDS, scores, EMPTY_MANUAL)
    expect(result).toEqual(
      new Set(['w1', 'w2', 'w3', 'w4', 'w5', 'w6', 'w7', 'w8', 'w9', 'w10', 'w11', 'w12']),
    )
  })

  it('includes manually unlocked words and their step', () => {
    const manual = new Set(['w13', 'w14', 'w15', 'w16'])
    const result = getUnlockedKotobaWordIds(WORDS, {}, manual)
    expect(result).toEqual(
      new Set(['w1', 'w2', 'w3', 'w4', 'w5', 'w6', 'w13', 'w14', 'w15', 'w16']),
    )
  })

  it('returns all words when all steps complete', () => {
    const scores: Record<string, number> = {}
    for (const w of WORDS) scores[w] = 3
    const result = getUnlockedKotobaWordIds(WORDS, scores, EMPTY_MANUAL)
    expect(result).toEqual(new Set(WORDS))
  })

  it('returns empty set for empty word list', () => {
    const result = getUnlockedKotobaWordIds([], {}, EMPTY_MANUAL)
    expect(result).toEqual(new Set())
  })
})

// ── buildAutoMasteryScores ──────────────────

const LEVEL_WORD_IDS: Record<string, readonly string[]> = {
  N5: ['n5-a', 'n5-b', 'n5-c'],
  N4: ['n4-a', 'n4-b'],
  N3: ['n3-a'],
  N2: ['n2-a', 'n2-b'],
  N1: ['n1-a'],
}

describe('buildAutoMasteryScores', () => {
  it('returns empty map when N5 is selected (nothing below)', () => {
    const result = buildAutoMasteryScores('N5', LEVEL_WORD_IDS)
    expect(Object.keys(result)).toHaveLength(0)
  })

  it('masters all N5 words when N4 is selected', () => {
    const result = buildAutoMasteryScores('N4', LEVEL_WORD_IDS)
    expect(Object.keys(result)).toHaveLength(3)
    expect(result['n5-a']).toBe(KOTOBA_MASTERY_THRESHOLD)
    expect(result['n5-b']).toBe(KOTOBA_MASTERY_THRESHOLD)
    expect(result['n5-c']).toBe(KOTOBA_MASTERY_THRESHOLD)
  })

  it('masters N5 and N4 words when N3 is selected', () => {
    const result = buildAutoMasteryScores('N3', LEVEL_WORD_IDS)
    expect(Object.keys(result)).toHaveLength(5)
    expect(result['n5-a']).toBe(KOTOBA_MASTERY_THRESHOLD)
    expect(result['n4-a']).toBe(KOTOBA_MASTERY_THRESHOLD)
    expect(result['n4-b']).toBe(KOTOBA_MASTERY_THRESHOLD)
  })

  it('masters everything below N1', () => {
    const result = buildAutoMasteryScores('N1', LEVEL_WORD_IDS)
    expect(Object.keys(result)).toHaveLength(8)
    expect(result['n1-a']).toBeUndefined()
  })

  it('does not include words at the selected level', () => {
    const result = buildAutoMasteryScores('N3', LEVEL_WORD_IDS)
    expect(result['n3-a']).toBeUndefined()
    expect(result['n2-a']).toBeUndefined()
    expect(result['n1-a']).toBeUndefined()
  })

  it('returns empty map for empty level data', () => {
    const result = buildAutoMasteryScores('N4', {})
    expect(Object.keys(result)).toHaveLength(0)
  })
})
