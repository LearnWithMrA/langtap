// ------------------------------------------------------------
// File: data/words/__tests__/word-bank.test.ts
// Purpose: Data integrity tests for generated word bank files.
// Depends on: data/words/index.ts, data/kana/characters.ts
// ------------------------------------------------------------

import { describe, it, expect } from 'vitest'
import { WORD_BANK, ALL_WORDS } from '@/data/words'
import { KANA_CHARACTERS } from '@/data/kana/characters'
import type { JlptLevel } from '@/types/user.types'

// ── Helpers ──────────────────────────────────

const charIdSet = new Set(KANA_CHARACTERS.map((c) => c.id))
const LEVELS: JlptLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1']

// ── Schema validation ────────────────────────

describe('word bank schema', () => {
  for (const level of LEVELS) {
    describe(level, () => {
      it('every entry has non-empty kana', () => {
        for (const word of WORD_BANK[level]) {
          expect(word.kana.length, `word ${word.id} has empty kana`).toBeGreaterThan(0)
        }
      })

      it('every entry has non-empty meaning', () => {
        for (const word of WORD_BANK[level]) {
          expect(word.meaning.length, `word ${word.id} has empty meaning`).toBeGreaterThan(0)
        }
      })

      it('every entry has at least 1 characterId', () => {
        for (const word of WORD_BANK[level]) {
          expect(
            word.characterIds.length,
            `word ${word.id} (${word.kana}) has ${word.characterIds.length} characterIds`,
          ).toBeGreaterThanOrEqual(1)
        }
      })

      it('every entry has correct jlptLevel', () => {
        for (const word of WORD_BANK[level]) {
          expect(word.jlptLevel).toBe(level)
        }
      })
    })
  }
})

// ── Cross-references ─────────────────────────

describe('word bank cross-references', () => {
  it('every characterId references a real character in characters.ts', () => {
    for (const word of ALL_WORDS) {
      for (const charId of word.characterIds) {
        expect(
          charIdSet.has(charId),
          `word ${word.id} (${word.kana}) references unknown charId "${charId}"`,
        ).toBe(true)
      }
    }
  })

  it('no duplicate word IDs within a level', () => {
    for (const level of LEVELS) {
      const ids = WORD_BANK[level].map((w) => w.id)
      expect(new Set(ids).size, `${level} has duplicate IDs`).toBe(ids.length)
    }
  })

  it('no duplicate word IDs across all levels', () => {
    const seen = new Set<string>()
    for (const word of ALL_WORDS) {
      expect(seen.has(word.id), `duplicate ID "${word.id}" (${word.kana})`).toBe(false)
      seen.add(word.id)
    }
  })
})

// ── Size ─────────────────────────────────────

describe('word bank size', () => {
  it('N5 has at least 600 words', () => {
    expect(WORD_BANK.N5.length).toBeGreaterThanOrEqual(600)
  })

  it('all levels combined have at least 5000 words', () => {
    expect(ALL_WORDS.length).toBeGreaterThanOrEqual(5000)
  })

  for (const level of LEVELS) {
    it(`${level} is not empty`, () => {
      expect(WORD_BANK[level].length).toBeGreaterThan(0)
    })
  }
})
