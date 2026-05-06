// ------------------------------------------------------------
// File: engine/__tests__/selection.test.ts
// Purpose: Tests for the character and word selection algorithm.
//          Deterministic tests use injectable RNG.
//          Statistical tests use seeded PRNG.
// Depends on: engine/selection.ts
// ------------------------------------------------------------

import { describe, it, expect } from 'vitest'
import {
  selectNextPrompt,
  buildCharacterWeights,
  buildWordIndex,
  weightedRandomDraw,
  selectWordForCharacter,
} from '@/engine/selection'
import type { CharacterWithMastery } from '@/types/game.types'
import type { WordBankEntry } from '@/types/word.types'

// ── Test helpers ─────────────────────────────

function makeWord(
  id: string,
  characterIds: string[],
  jlptLevel: 'N5' | 'N4' | 'N3' | 'N2' | 'N1' = 'N5',
): WordBankEntry {
  return { id, kana: id, kanji: null, meaning: id, jlptLevel, characterIds, audioFile: null }
}

function makeChar(id: string, masteryScore: number): CharacterWithMastery {
  return { id, masteryScore }
}

// Simple seeded LCG PRNG for deterministic statistical tests.
function createSeededRng(seed: number): () => number {
  let state = seed
  return (): number => {
    state = (state * 1664525 + 1013904223) & 0x7fffffff
    return state / 0x7fffffff
  }
}

// ── buildCharacterWeights ────────────────────

describe('buildCharacterWeights', () => {
  it('includes only unlocked characters', () => {
    const chars = [makeChar('h-a', 0), makeChar('h-ka', 0)]
    const result = buildCharacterWeights(chars, new Set(['h-a']))
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('h-a')
  })

  it('excludes locked characters', () => {
    const chars = [makeChar('h-a', 0), makeChar('h-ka', 0)]
    const result = buildCharacterWeights(chars, new Set())
    expect(result).toHaveLength(0)
  })

  it('assigns weight 1.0 to score-0 characters', () => {
    const chars = [makeChar('h-a', 0)]
    const result = buildCharacterWeights(chars, new Set(['h-a']))
    expect(result[0].weight).toBe(1.0)
  })

  it('assigns weight 0.5 to score-1 characters', () => {
    const chars = [makeChar('h-a', 1)]
    const result = buildCharacterWeights(chars, new Set(['h-a']))
    expect(result[0].weight).toBeCloseTo(0.5)
  })

  it('assigns weight 0.02 to score-49 characters', () => {
    const chars = [makeChar('h-a', 49)]
    const result = buildCharacterWeights(chars, new Set(['h-a']))
    expect(result[0].weight).toBeCloseTo(0.02)
  })

  it('returns empty array when no characters are unlocked', () => {
    const result = buildCharacterWeights([], new Set())
    expect(result).toHaveLength(0)
  })
})

// ── weightedRandomDraw ───────────────────────

describe('weightedRandomDraw', () => {
  it('returns the only item when given a single-item list', () => {
    const items = [{ id: 'a', weight: 1 }]
    const result = weightedRandomDraw(items, () => 0.5)
    expect(result.id).toBe('a')
  })

  it('returns first item when rng returns 0.0', () => {
    const items = [
      { id: 'a', weight: 10 },
      { id: 'b', weight: 10 },
    ]
    const result = weightedRandomDraw(items, () => 0.0)
    expect(result.id).toBe('a')
  })

  it('returns last item when rng returns near 1.0', () => {
    const items = [
      { id: 'a', weight: 10 },
      { id: 'b', weight: 10 },
    ]
    const result = weightedRandomDraw(items, () => 0.99)
    expect(result.id).toBe('b')
  })

  it('throws on empty array', () => {
    expect(() => weightedRandomDraw([], () => 0.5)).toThrow()
  })

  it('throws if any weight is negative', () => {
    expect(() => weightedRandomDraw([{ id: 'a', weight: -1 }], () => 0.5)).toThrow()
  })

  it('throws if any weight is NaN', () => {
    expect(() => weightedRandomDraw([{ id: 'a', weight: NaN }], () => 0.5)).toThrow()
  })

  it('distributes proportionally to weights (seeded, N=10000)', () => {
    const items = [
      { id: 'heavy', weight: 9 },
      { id: 'light', weight: 1 },
    ]
    const rng = createSeededRng(42)
    const counts: Record<string, number> = { heavy: 0, light: 0 }
    for (let i = 0; i < 10000; i++) {
      const result = weightedRandomDraw(items, rng)
      counts[result.id]++
    }
    expect(counts['heavy']).toBeGreaterThan(counts['light'])
    expect(counts['heavy']).toBeGreaterThan(7000)
  })
})

// ── buildWordIndex ───────────────────────────

describe('buildWordIndex', () => {
  it('groups words by character ID', () => {
    const words = [
      makeWord('w1', ['h-a', 'h-ka']),
      makeWord('w2', ['h-a']),
      makeWord('w3', ['h-sa']),
    ]
    const unlocked = new Set(['h-a', 'h-ka', 'h-sa'])
    const index = buildWordIndex(words, unlocked)
    expect(index.get('h-a')).toHaveLength(2)
    expect(index.get('h-sa')).toHaveLength(1)
  })

  it('excludes words with locked characters', () => {
    const words = [makeWord('w1', ['h-a', 'h-ka']), makeWord('w2', ['h-a', 'h-locked'])]
    const unlocked = new Set(['h-a', 'h-ka'])
    const index = buildWordIndex(words, unlocked)
    expect(index.get('h-a')).toHaveLength(1)
    expect(index.get('h-a')![0].id).toBe('w1')
  })

  it('returns empty map for no eligible words', () => {
    const words = [makeWord('w1', ['h-locked'])]
    const index = buildWordIndex(words, new Set(['h-a']))
    expect(index.size).toBe(0)
  })
})

// ── selectWordForCharacter ───────────────────

describe('selectWordForCharacter', () => {
  const unlocked = new Set(['h-a', 'h-ka'])

  it('selects a word at the preferred level when available', () => {
    const words = [makeWord('w-n5', ['h-a'], 'N5'), makeWord('w-n4', ['h-a'], 'N4')]
    const index = buildWordIndex(words, unlocked)
    const result = selectWordForCharacter('h-a', index, {}, 'N5', () => 0.5)
    expect(result).not.toBeNull()
    expect(result!.word.jlptLevel).toBe('N5')
  })

  it('prefers lower-counter words', () => {
    const words = [makeWord('w-low', ['h-a'], 'N5'), makeWord('w-high', ['h-a'], 'N5')]
    const index = buildWordIndex(words, unlocked)
    const counters = { 'w-low': 0, 'w-high': 4 }
    const rng = createSeededRng(42)
    const counts: Record<string, number> = { 'w-low': 0, 'w-high': 0 }
    for (let i = 0; i < 1000; i++) {
      const result = selectWordForCharacter('h-a', index, counters, 'N5', rng)
      if (result) counts[result.word.id]++
    }
    expect(counts['w-low']).toBeGreaterThan(counts['w-high'])
  })

  it('falls back to other levels when preferred is exhausted', () => {
    const words = [makeWord('w-n5', ['h-a'], 'N5'), makeWord('w-n4', ['h-a'], 'N4')]
    const index = buildWordIndex(words, unlocked)
    const counters = { 'w-n5': 5 }
    const result = selectWordForCharacter('h-a', index, counters, 'N5', () => 0.5)
    expect(result).not.toBeNull()
    expect(result!.word.jlptLevel).toBe('N4')
  })

  it('resets counters when all candidates are at MAX', () => {
    const words = [makeWord('w1', ['h-a'], 'N5')]
    const index = buildWordIndex(words, unlocked)
    const counters = { w1: 5 }
    const result = selectWordForCharacter('h-a', index, counters, 'N5', () => 0.5)
    expect(result).not.toBeNull()
    expect(result!.updatedCounters['w1']).toBe(0)
  })

  it('returns null when no eligible words exist for the character', () => {
    const index = buildWordIndex([], unlocked)
    const result = selectWordForCharacter('h-a', index, {}, 'N5', () => 0.5)
    expect(result).toBeNull()
  })

  it('returns null for character not in index', () => {
    const words = [makeWord('w1', ['h-ka'], 'N5')]
    const index = buildWordIndex(words, unlocked)
    const result = selectWordForCharacter('h-a', index, {}, 'N5', () => 0.5)
    expect(result).toBeNull()
  })
})

// ── selectNextPrompt ─────────────────────────

describe('selectNextPrompt', () => {
  describe('single character scenarios', () => {
    it('always returns the only unlocked character', () => {
      const chars = [makeChar('h-a', 0)]
      const words = [makeWord('w1', ['h-a'])]
      const unlocked = new Set(['h-a'])
      const result = selectNextPrompt(chars, words, {}, unlocked, 'N5', () => 0.5)
      expect(result).not.toBeNull()
      expect(result!.prompt.characterId).toBe('h-a')
    })

    it('returns null when no characters are unlocked', () => {
      const result = selectNextPrompt([], [], {}, new Set(), 'N5', () => 0.5)
      expect(result).toBeNull()
    })
  })

  describe('deterministic selection (fixed rng)', () => {
    const chars = [makeChar('h-a', 0), makeChar('h-ka', 50)]
    const words = [makeWord('w1', ['h-a']), makeWord('w2', ['h-ka'])]
    const unlocked = new Set(['h-a', 'h-ka'])

    it('selects the expected character with rng=0.0', () => {
      const result = selectNextPrompt(chars, words, {}, unlocked, 'N5', () => 0.0)
      expect(result).not.toBeNull()
      expect(result!.prompt.characterId).toBe('h-a')
    })
  })

  describe('word selection integration', () => {
    it('returns a word that contains the selected character', () => {
      const chars = [makeChar('h-a', 0)]
      const words = [makeWord('w1', ['h-a'])]
      const unlocked = new Set(['h-a'])
      const result = selectNextPrompt(chars, words, {}, unlocked, 'N5', () => 0.5)
      expect(result).not.toBeNull()
      expect(result!.prompt.word.characterIds).toContain('h-a')
    })

    it('never returns a word with locked characters', () => {
      const chars = [makeChar('h-a', 0)]
      const words = [makeWord('w-good', ['h-a']), makeWord('w-bad', ['h-a', 'h-locked'])]
      const unlocked = new Set(['h-a'])
      const rng = createSeededRng(42)
      for (let i = 0; i < 100; i++) {
        const result = selectNextPrompt(chars, words, {}, unlocked, 'N5', rng)
        if (result) {
          expect(result.prompt.word.id).toBe('w-good')
        }
      }
    })

    it('returns null when feasible set is empty (no words for unlocked chars)', () => {
      const chars = [makeChar('h-a', 0)]
      const words = [makeWord('w-bad', ['h-a', 'h-locked'])]
      const unlocked = new Set(['h-a'])
      const result = selectNextPrompt(chars, words, {}, unlocked, 'N5', () => 0.5)
      expect(result).toBeNull()
    })
  })

  describe('statistical distribution (seeded rng, N=10000)', () => {
    it('selects score-0 characters more often than score-50', () => {
      const chars = [makeChar('h-a', 0), makeChar('h-ka', 50)]
      const words = [makeWord('w1', ['h-a']), makeWord('w2', ['h-ka'])]
      const unlocked = new Set(['h-a', 'h-ka'])
      const rng = createSeededRng(42)
      const counts: Record<string, number> = { 'h-a': 0, 'h-ka': 0 }
      for (let i = 0; i < 10000; i++) {
        const result = selectNextPrompt(chars, words, {}, unlocked, 'N5', rng)
        if (result) counts[result.prompt.characterId]++
      }
      expect(counts['h-a']).toBeGreaterThan(counts['h-ka'])
      expect(counts['h-a']).toBeGreaterThan(counts['h-ka'] * 5)
    })

    it('monotonic distribution: lower score = more selections', () => {
      const chars = [makeChar('a', 0), makeChar('b', 10), makeChar('c', 50)]
      const words = [makeWord('wa', ['a']), makeWord('wb', ['b']), makeWord('wc', ['c'])]
      const unlocked = new Set(['a', 'b', 'c'])
      const rng = createSeededRng(123)
      const counts: Record<string, number> = { a: 0, b: 0, c: 0 }
      for (let i = 0; i < 10000; i++) {
        const result = selectNextPrompt(chars, words, {}, unlocked, 'N5', rng)
        if (result) counts[result.prompt.characterId]++
      }
      expect(counts['a']).toBeGreaterThan(counts['b'])
      expect(counts['b']).toBeGreaterThan(counts['c'])
    })
  })

  describe('invariants', () => {
    it('selected word always contains selected character', () => {
      const chars = [makeChar('h-a', 0), makeChar('h-ka', 5)]
      const words = [
        makeWord('w1', ['h-a']),
        makeWord('w2', ['h-a', 'h-ka']),
        makeWord('w3', ['h-ka']),
      ]
      const unlocked = new Set(['h-a', 'h-ka'])
      const rng = createSeededRng(42)
      for (let i = 0; i < 500; i++) {
        const result = selectNextPrompt(chars, words, {}, unlocked, 'N5', rng)
        if (result) {
          expect(result.prompt.word.characterIds).toContain(result.prompt.characterId)
        }
      }
    })
  })

  describe('previousCharacterId exclusion', () => {
    it('never selects the previous character when alternatives exist', () => {
      const chars = [makeChar('h-a', 0), makeChar('h-ka', 0)]
      const words = [makeWord('w1', ['h-a']), makeWord('w2', ['h-ka'])]
      const unlocked = new Set(['h-a', 'h-ka'])
      const rng = createSeededRng(42)
      for (let i = 0; i < 200; i++) {
        const result = selectNextPrompt(chars, words, {}, unlocked, 'N5', rng, 'h-a')
        expect(result).not.toBeNull()
        expect(result!.prompt.characterId).toBe('h-ka')
      }
    })

    it('allows the previous character when it is the only option', () => {
      const chars = [makeChar('h-a', 0)]
      const words = [makeWord('w1', ['h-a'])]
      const unlocked = new Set(['h-a'])
      const result = selectNextPrompt(chars, words, {}, unlocked, 'N5', () => 0.5, 'h-a')
      expect(result).not.toBeNull()
      expect(result!.prompt.characterId).toBe('h-a')
    })

    it('works correctly without a previous character', () => {
      const chars = [makeChar('h-a', 0)]
      const words = [makeWord('w1', ['h-a'])]
      const unlocked = new Set(['h-a'])
      const result = selectNextPrompt(chars, words, {}, unlocked, 'N5', () => 0.5)
      expect(result).not.toBeNull()
      expect(result!.prompt.characterId).toBe('h-a')
    })
  })
})
