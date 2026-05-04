// ─────────────────────────────────────────────
// File: engine/__tests__/kana-selection.test.ts
// Purpose: Tests for selectNextKanaPrompt with separate
//          learning scores and mastery scores.
// Depends on: engine/selection.ts
// ─────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import { selectNextKanaPrompt } from '@/engine/selection'
import type { CharacterWithMastery } from '@/types/game.types'
import type { WordBankEntry } from '@/types/word.types'

function makeWord(id: string, characterIds: string[]): WordBankEntry {
  return { id, kana: id, kanji: null, meaning: id, jlptLevel: 'N5', characterIds, audioFile: null }
}

function makeChar(id: string, masteryScore: number): CharacterWithMastery {
  return { id, masteryScore }
}

function createSeededRng(seed: number): () => number {
  let state = seed
  return (): number => {
    state = (state * 1664525 + 1013904223) & 0x7fffffff
    return state / 0x7fffffff
  }
}

const words = [
  makeWord('w1', ['h-a', 'h-i']),
  makeWord('w2', ['h-a', 'h-u']),
  makeWord('w3', ['h-i', 'h-u']),
  makeWord('w4', ['h-a', 'h-ka']),
  makeWord('w5', ['h-i', 'h-ka']),
  makeWord('w6', ['h-u', 'h-ka']),
  makeWord('w7', ['h-a', 'h-ki']),
  makeWord('w8', ['h-i', 'h-ki']),
  makeWord('w9', ['h-u', 'h-ki']),
  makeWord('w10', ['h-ka', 'h-ki']),
]

describe('selectNextKanaPrompt', () => {
  it('returns character prompts when below min eligible words', () => {
    const chars = [makeChar('h-a', 0), makeChar('h-i', 0)]
    const practice = new Set(['h-a', 'h-i'])
    const learning = { 'h-a': 1, 'h-i': 2 }

    const result = selectNextKanaPrompt(
      chars,
      words,
      {},
      practice,
      new Set(),
      new Set(),
      learning,
      'N5',
      10,
      () => 0.5,
    )
    expect(result).not.toBeNull()
    expect(result!.kind).toBe('character')
  })

  it('returns word prompts when enough words are eligible', () => {
    const chars = [
      makeChar('h-a', 10),
      makeChar('h-i', 10),
      makeChar('h-u', 10),
      makeChar('h-ka', 10),
      makeChar('h-ki', 10),
    ]
    const practice = new Set(['h-a', 'h-i', 'h-u', 'h-ka', 'h-ki'])
    const wordEligible = new Set(['h-a', 'h-i', 'h-u', 'h-ka', 'h-ki'])
    const learning = { 'h-a': 5, 'h-i': 5, 'h-u': 5, 'h-ka': 5, 'h-ki': 5 }

    const result = selectNextKanaPrompt(
      chars,
      words,
      {},
      practice,
      wordEligible,
      new Set(),
      learning,
      'N5',
      10,
      () => 0.3,
    )
    expect(result).not.toBeNull()
    expect(result!.kind).toBe('word')
  })

  it('manual unlocks never get character drills, fall back to words', () => {
    const chars = [makeChar('h-a', 0), makeChar('h-i', 0)]
    const practice = new Set(['h-a', 'h-i'])
    const wordEligible = new Set(['h-a', 'h-i'])
    const manual = new Set(['h-a', 'h-i'])

    const result = selectNextKanaPrompt(
      chars,
      words,
      {},
      practice,
      wordEligible,
      manual,
      {},
      'N5',
      10,
    )
    expect(result).not.toBeNull()
    expect(result!.kind).toBe('word')
  })

  it('special characters are excluded from solo drills', () => {
    const chars = [makeChar('h-sokuon', 0), makeChar('k-longvowel', 0)]
    const practice = new Set(['h-sokuon', 'k-longvowel'])

    const result = selectNextKanaPrompt(
      chars,
      words,
      {},
      practice,
      new Set(),
      new Set(),
      {},
      'N5',
      10,
    )
    expect(result).toBeNull()
  })

  it('mixes word and character prompts at ~60/40 ratio', () => {
    const chars = [
      makeChar('h-a', 10),
      makeChar('h-i', 10),
      makeChar('h-u', 10),
      makeChar('h-ka', 10),
      makeChar('h-ki', 10),
      makeChar('h-ku', 0),
    ]
    const practice = new Set(['h-a', 'h-i', 'h-u', 'h-ka', 'h-ki', 'h-ku'])
    const wordEligible = new Set(['h-a', 'h-i', 'h-u', 'h-ka', 'h-ki'])
    const learning: Record<string, number> = {
      'h-a': 5,
      'h-i': 5,
      'h-u': 5,
      'h-ka': 5,
      'h-ki': 5,
      'h-ku': 2,
    }

    const rng = createSeededRng(42)
    let wordCount = 0
    let charCount = 0

    for (let i = 0; i < 200; i++) {
      const result = selectNextKanaPrompt(
        chars,
        words,
        {},
        practice,
        wordEligible,
        new Set(),
        learning,
        'N5',
        10,
        rng,
      )
      if (result?.kind === 'word') wordCount++
      if (result?.kind === 'character') charCount++
    }

    const wordRatio = wordCount / (wordCount + charCount)
    expect(wordRatio).toBeGreaterThan(0.4)
    expect(wordRatio).toBeLessThan(0.8)
  })

  it('returns 100% words when all learning scores are at threshold', () => {
    const chars = [
      makeChar('h-a', 10),
      makeChar('h-i', 10),
      makeChar('h-u', 10),
      makeChar('h-ka', 10),
      makeChar('h-ki', 10),
    ]
    const practice = new Set(['h-a', 'h-i', 'h-u', 'h-ka', 'h-ki'])
    const wordEligible = new Set(['h-a', 'h-i', 'h-u', 'h-ka', 'h-ki'])
    const learning = { 'h-a': 5, 'h-i': 5, 'h-u': 5, 'h-ka': 5, 'h-ki': 5 }

    const rng = createSeededRng(99)
    for (let i = 0; i < 20; i++) {
      const result = selectNextKanaPrompt(
        chars,
        words,
        {},
        practice,
        wordEligible,
        new Set(),
        learning,
        'N5',
        10,
        rng,
      )
      expect(result?.kind).toBe('word')
    }
  })
})
