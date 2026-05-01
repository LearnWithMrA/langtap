// ─────────────────────────────────────────────
// File: engine/__tests__/kotoba-selection.test.ts
// Purpose: Tests for Kotoba word selection engine.
//          Covers: pool building, weighted selection, counter
//          exhaustion/reset, distractor generation, input
//          immutability, and locked word exclusion.
// Depends on: engine/kotoba-selection.ts
// ─────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import {
  buildKotobaWordPool,
  selectNextKotobaWord,
  generateKotobaDistractors,
} from '@/engine/kotoba-selection'
import { MAX_WORD_COUNTER } from '@/engine/constants'
import type { WordBankEntry, WordMasteryScoreMap, WordCounterMap } from '@/types/word.types'

// ── Fixtures ────────────────────────────────

function makeWord(id: string, kanji: string | null = null): WordBankEntry {
  return {
    id,
    kana: `kana-${id}`,
    kanji,
    meaning: `meaning-${id}`,
    jlptLevel: 'N5',
    characterIds: ['h-a'],
    audioFile: null,
  }
}

const W1 = makeWord('w1')
const W2 = makeWord('w2')
const W3 = makeWord('w3')
const W4 = makeWord('w4')
const BANK = [W1, W2, W3, W4]

const KANJI_BANK = [
  makeWord('k1', '犬'),
  makeWord('k2', '猫'),
  makeWord('k3', '花'),
  makeWord('k4', '山'),
  makeWord('k5', null),
]

function seededRng(seed: number): () => number {
  let s = seed
  return (): number => {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }
}

// ── buildKotobaWordPool ─────────────────────

describe('buildKotobaWordPool', () => {
  it('returns only unlocked words', () => {
    const unlocked = new Set(['w1', 'w3'])
    const pool = buildKotobaWordPool(unlocked, BANK, {}, {})

    expect(pool.map((w) => w.id)).toEqual(['w1', 'w3'])
  })

  it('excludes words at MAX_WORD_COUNTER', () => {
    const unlocked = new Set(['w1', 'w2'])
    const counters: WordCounterMap = { w1: MAX_WORD_COUNTER }
    const pool = buildKotobaWordPool(unlocked, BANK, {}, counters)

    expect(pool.map((w) => w.id)).toEqual(['w2'])
  })

  it('returns empty for empty unlocked set', () => {
    const pool = buildKotobaWordPool(new Set(), BANK, {}, {})
    expect(pool).toHaveLength(0)
  })

  it('weights favour low-mastery words', () => {
    const unlocked = new Set(['w1', 'w2'])
    const scores: WordMasteryScoreMap = { w1: 0, w2: 10 }
    const pool = buildKotobaWordPool(unlocked, BANK, scores, {})

    const w1Weight = pool.find((w) => w.id === 'w1')!.weight
    const w2Weight = pool.find((w) => w.id === 'w2')!.weight
    expect(w1Weight).toBeGreaterThan(w2Weight)
  })

  it('weight formula matches 1/(score+1) * counterWeight', () => {
    const unlocked = new Set(['w1'])
    const scores: WordMasteryScoreMap = { w1: 4 }
    const counters: WordCounterMap = { w1: 0 }
    const pool = buildKotobaWordPool(unlocked, BANK, scores, counters)

    const expectedMastery = 1 / (4 + 1)
    const expectedCounter = MAX_WORD_COUNTER - 0 + 1
    expect(pool[0].weight).toBeCloseTo(expectedMastery * expectedCounter)
  })
})

// ── selectNextKotobaWord ────────────────────

describe('selectNextKotobaWord', () => {
  it('returns a word from the unlocked set', () => {
    const unlocked = new Set(['w1', 'w2'])
    const result = selectNextKotobaWord(unlocked, BANK, {}, {}, seededRng(42))

    expect(result).not.toBeNull()
    expect(unlocked.has(result!.word.id)).toBe(true)
  })

  it('returns null for empty unlocked set', () => {
    const result = selectNextKotobaWord(new Set(), BANK, {}, {})
    expect(result).toBeNull()
  })

  it('never returns a locked word', () => {
    const unlocked = new Set(['w2'])
    for (let i = 0; i < 50; i++) {
      const result = selectNextKotobaWord(unlocked, BANK, {}, {}, seededRng(i))
      expect(result!.word.id).toBe('w2')
    }
  })

  it('returns single word when pool has one entry', () => {
    const unlocked = new Set(['w3'])
    const result = selectNextKotobaWord(unlocked, BANK, {}, {}, seededRng(1))

    expect(result).not.toBeNull()
    expect(result!.word.id).toBe('w3')
  })

  it('resets counters when all unlocked words are at MAX', () => {
    const unlocked = new Set(['w1', 'w2'])
    const counters: WordCounterMap = {
      w1: MAX_WORD_COUNTER,
      w2: MAX_WORD_COUNTER,
    }

    const result = selectNextKotobaWord(unlocked, BANK, {}, counters, seededRng(7))

    expect(result).not.toBeNull()
    expect(result!.didReset).toBe(true)
    expect(result!.updatedCounters.w1).toBe(0)
    expect(result!.updatedCounters.w2).toBe(0)
  })

  it('does not reset when at least one word is below MAX', () => {
    const unlocked = new Set(['w1', 'w2'])
    const counters: WordCounterMap = { w1: MAX_WORD_COUNTER, w2: 2 }

    const result = selectNextKotobaWord(unlocked, BANK, {}, counters, seededRng(3))

    expect(result).not.toBeNull()
    expect(result!.didReset).toBe(false)
    expect(result!.word.id).toBe('w2')
  })

  it('does not mutate the input score map', () => {
    const unlocked = new Set(['w1', 'w2'])
    const scores: WordMasteryScoreMap = { w1: 5, w2: 3 }
    const scoresCopy = { ...scores }

    selectNextKotobaWord(unlocked, BANK, scores, {}, seededRng(1))

    expect(scores).toEqual(scoresCopy)
  })

  it('does not mutate the input counter map', () => {
    const unlocked = new Set(['w1', 'w2'])
    const counters: WordCounterMap = { w1: 3, w2: 1 }
    const countersCopy = { ...counters }

    selectNextKotobaWord(unlocked, BANK, {}, counters, seededRng(1))

    expect(counters).toEqual(countersCopy)
  })

  it('returns stable counter state after reset', () => {
    const unlocked = new Set(['w1'])
    const counters: WordCounterMap = { w1: MAX_WORD_COUNTER }

    const result = selectNextKotobaWord(unlocked, BANK, {}, counters, seededRng(1))

    expect(result).not.toBeNull()
    expect(result!.didReset).toBe(true)

    const result2 = selectNextKotobaWord(unlocked, BANK, {}, result!.updatedCounters, seededRng(2))
    expect(result2).not.toBeNull()
    expect(result2!.didReset).toBe(false)
  })

  it('is deterministic with seeded RNG', () => {
    const unlocked = new Set(['w1', 'w2', 'w3', 'w4'])
    const r1 = selectNextKotobaWord(unlocked, BANK, {}, {}, seededRng(99))
    const r2 = selectNextKotobaWord(unlocked, BANK, {}, {}, seededRng(99))

    expect(r1!.word.id).toBe(r2!.word.id)
  })
})

// ── generateKotobaDistractors ───────────────

describe('generateKotobaDistractors', () => {
  it('returns the requested number of distractors', () => {
    const result = generateKotobaDistractors('犬', 3, KANJI_BANK)
    expect(result).toHaveLength(3)
  })

  it('never includes the correct kanji', () => {
    for (let i = 0; i < 20; i++) {
      const result = generateKotobaDistractors('犬', 3, KANJI_BANK, seededRng(i))
      expect(result).not.toContain('犬')
    }
  })

  it('excludes null-kanji words', () => {
    const result = generateKotobaDistractors('犬', 10, KANJI_BANK)
    expect(result.every((k) => k !== null && k !== undefined)).toBe(true)
  })

  it('returns fewer than requested if pool is small', () => {
    const smallBank = [makeWord('k1', '犬'), makeWord('k2', '猫')]
    const result = generateKotobaDistractors('犬', 5, smallBank)

    expect(result.length).toBeLessThanOrEqual(1)
  })

  it('returns empty for a bank with no other kanji', () => {
    const singleBank = [makeWord('k1', '犬')]
    const result = generateKotobaDistractors('犬', 3, singleBank)

    expect(result).toHaveLength(0)
  })

  it('returns unique entries', () => {
    const result = generateKotobaDistractors('犬', 3, KANJI_BANK)
    const unique = new Set(result)
    expect(unique.size).toBe(result.length)
  })
})
