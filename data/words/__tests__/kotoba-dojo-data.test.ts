// ─────────────────────────────────────────────
// File: data/words/__tests__/kotoba-dojo-data.test.ts
// Purpose: Tests for the Kotoba Dojo data adapter.
//          Covers: JLPT case mapping, WordBankEntry to KotobaWord
//          conversion, level grouping, and word lookup map building.
// Depends on: data/words/kotoba-dojo-data.ts
// ─────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import {
  jlptToLowercase,
  wordBankEntryToKotobaWord,
  buildKotobaGroups,
  buildWordLookup,
  buildKotobaDojoData,
} from '@/data/words/kotoba-dojo-data'
import type { WordBankEntry } from '@/types/word.types'
import type { KotobaLevel } from '@/data/words/kotoba-levels/types'

// ── Test data ────────────────────────────────

function makeEntry(id: string, kana: string, kanji: string | null, meaning: string): WordBankEntry {
  return {
    id,
    kana,
    kanji,
    meaning,
    jlptLevel: 'N5',
    characterIds: [],
    audioFile: null,
  }
}

const ENTRY_A = makeEntry('100', 'あう', '会う', 'to meet')
const ENTRY_B = makeEntry('101', 'あお', '青', 'blue (noun)')
const ENTRY_C = makeEntry('102', 'いぬ', '犬', 'dog')
const ENTRY_D = makeEntry('103', 'ねこ', '猫', 'cat')

// ── jlptToLowercase ──────────────────────────

describe('jlptToLowercase', () => {
  it('converts N5 to n5', () => {
    expect(jlptToLowercase('N5')).toBe('n5')
  })

  it('converts N1 to n1', () => {
    expect(jlptToLowercase('N1')).toBe('n1')
  })

  it('converts all five levels', () => {
    expect(jlptToLowercase('N5')).toBe('n5')
    expect(jlptToLowercase('N4')).toBe('n4')
    expect(jlptToLowercase('N3')).toBe('n3')
    expect(jlptToLowercase('N2')).toBe('n2')
    expect(jlptToLowercase('N1')).toBe('n1')
  })
})

// ── wordBankEntryToKotobaWord ────────────────

describe('wordBankEntryToKotobaWord', () => {
  it('maps meaning to english', () => {
    const word = wordBankEntryToKotobaWord(ENTRY_A)
    expect(word.english).toBe('to meet')
  })

  it('maps jlptLevel to lowercase jlpt', () => {
    const word = wordBankEntryToKotobaWord(ENTRY_A)
    expect(word.jlpt).toBe('n5')
  })

  it('preserves id, kana, and kanji', () => {
    const word = wordBankEntryToKotobaWord(ENTRY_A)
    expect(word.id).toBe('100')
    expect(word.kana).toBe('あう')
    expect(word.kanji).toBe('会う')
  })

  it('preserves null kanji for kana-only words', () => {
    const kanaOnly = makeEntry('200', 'でも', null, 'but')
    const word = wordBankEntryToKotobaWord(kanaOnly)
    expect(word.kanji).toBeNull()
  })

  it('does not include characterIds or audioFile', () => {
    const word = wordBankEntryToKotobaWord(ENTRY_A) as Record<string, unknown>
    expect(word).not.toHaveProperty('characterIds')
    expect(word).not.toHaveProperty('audioFile')
  })
})

// ── buildKotobaGroups ────────────────────────

describe('buildKotobaGroups', () => {
  it('pairs consecutive levels into groups of 2', () => {
    const levels: KotobaLevel[] = [
      { wordIds: ['a', 'b'] },
      { wordIds: ['c', 'd'] },
      { wordIds: ['e', 'f'] },
      { wordIds: ['g', 'h'] },
    ]
    const groups = buildKotobaGroups(levels, 'n5')
    expect(groups).toHaveLength(2)
    expect(groups[0].label).toBe('Levels 1-2')
    expect(groups[0].wordIds).toEqual(['a', 'b', 'c', 'd'])
    expect(groups[1].label).toBe('Levels 3-4')
    expect(groups[1].wordIds).toEqual(['e', 'f', 'g', 'h'])
  })

  it('handles an odd number of levels with a single-level last group', () => {
    const levels: KotobaLevel[] = [{ wordIds: ['a'] }, { wordIds: ['b'] }, { wordIds: ['c'] }]
    const groups = buildKotobaGroups(levels, 'n5')
    expect(groups).toHaveLength(2)
    expect(groups[1].label).toBe('Level 3')
    expect(groups[1].wordIds).toEqual(['c'])
  })

  it('generates stable IDs with jlpt prefix', () => {
    const levels: KotobaLevel[] = [{ wordIds: ['a'] }]
    const groups = buildKotobaGroups(levels, 'n3')
    expect(groups[0].id).toBe('n3-g0')
  })

  it('returns empty array for no levels', () => {
    expect(buildKotobaGroups([], 'n5')).toEqual([])
  })

  it('handles a single level', () => {
    const levels: KotobaLevel[] = [{ wordIds: ['a', 'b', 'c'] }]
    const groups = buildKotobaGroups(levels, 'n5')
    expect(groups).toHaveLength(1)
    expect(groups[0].label).toBe('Level 1')
  })
})

// ── buildWordLookup ──────────────────────────

describe('buildWordLookup', () => {
  it('builds a lookup map filtered to level word IDs', () => {
    const bank = [ENTRY_A, ENTRY_B, ENTRY_C]
    const levelIds = new Set(['100', '102'])
    const lookup = buildWordLookup(bank, levelIds)
    expect(Object.keys(lookup)).toHaveLength(2)
    expect(lookup['100']?.english).toBe('to meet')
    expect(lookup['102']?.english).toBe('dog')
    expect(lookup['101']).toBeUndefined()
  })

  it('returns empty map when no IDs match', () => {
    const bank = [ENTRY_A]
    const lookup = buildWordLookup(bank, new Set(['999']))
    expect(Object.keys(lookup)).toHaveLength(0)
  })
})

// ── buildKotobaDojoData ──────────────────────

describe('buildKotobaDojoData', () => {
  it('returns groups and words for a JLPT level', () => {
    const levels: KotobaLevel[] = [{ wordIds: ['100', '101'] }, { wordIds: ['102', '103'] }]
    const bank = [ENTRY_A, ENTRY_B, ENTRY_C, ENTRY_D]
    const data = buildKotobaDojoData(levels, bank, 'n5')

    expect(data.groups).toHaveLength(1)
    expect(data.groups[0].label).toBe('Levels 1-2')
    expect(data.groups[0].wordIds).toEqual(['100', '101', '102', '103'])
    expect(Object.keys(data.words)).toHaveLength(4)
    expect(data.words['100']?.english).toBe('to meet')
  })

  it('excludes word bank entries not referenced by any level', () => {
    const levels: KotobaLevel[] = [{ wordIds: ['100'] }]
    const bank = [ENTRY_A, ENTRY_B, ENTRY_C]
    const data = buildKotobaDojoData(levels, bank, 'n5')
    expect(Object.keys(data.words)).toHaveLength(1)
  })
})
