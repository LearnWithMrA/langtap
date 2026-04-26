// ─────────────────────────────────────────────
// File: samples/__tests__/kotoba-practice-fixtures.test.ts
// Purpose: Data integrity tests for Kotoba practice fixture data.
// Depends on: samples/kotoba-practice-fixtures.ts
// ─────────────────────────────────────────────

import { getMockKotobaWords, generateKanjiDistractors } from '@/samples/kotoba-practice-fixtures'

const WORDS = getMockKotobaWords()

describe('getMockKotobaWords', () => {
  it('returns 16 entries', () => {
    expect(WORDS).toHaveLength(16)
  })

  it('has unique IDs', () => {
    const ids = WORDS.map((w) => w.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('has non-empty english for every word', () => {
    for (const word of WORDS) {
      expect(word.english.length).toBeGreaterThan(0)
    }
  })

  it('has non-empty kana for every word', () => {
    for (const word of WORDS) {
      expect(word.kana.length).toBeGreaterThan(0)
    }
  })

  it('has characters array matching kana length', () => {
    for (const word of WORDS) {
      const joinedKana = word.characters.map((c) => c.kana).join('')
      expect(joinedKana).toBe(word.kana)
    }
  })

  it('marks kana-only words correctly', () => {
    const kanaOnly = WORDS.filter((w) => w.isKanaOnly)
    expect(kanaOnly.length).toBeGreaterThan(0)
    for (const word of kanaOnly) {
      expect(word.kanji).toBeNull()
    }
  })

  it('marks kanji words correctly', () => {
    const kanjiWords = WORDS.filter((w) => !w.isKanaOnly)
    expect(kanjiWords.length).toBeGreaterThan(0)
    for (const word of kanjiWords) {
      expect(word.kanji).not.toBeNull()
    }
  })

  it('includes kanji in acceptedAnswers for kanji words', () => {
    const kanjiWords = WORDS.filter((w) => w.kanji !== null)
    for (const word of kanjiWords) {
      expect(word.acceptedAnswers).toContain(word.kanji)
    }
  })

  it('includes correct answer in acceptedAnswers for all words', () => {
    for (const word of WORDS) {
      if (word.isKanaOnly) {
        expect(word.acceptedAnswers).toContain(word.kana)
      } else {
        expect(word.acceptedAnswers).toContain(word.kanji)
      }
    }
  })
})

describe('generateKanjiDistractors', () => {
  it('returns the requested number of distractors', () => {
    const distractors = generateKanjiDistractors('犬', 3)
    expect(distractors).toHaveLength(3)
  })

  it('does not include the correct answer', () => {
    const distractors = generateKanjiDistractors('犬', 3)
    expect(distractors).not.toContain('犬')
  })

  it('returns fewer if pool is too small', () => {
    const distractors = generateKanjiDistractors('犬', 100)
    expect(distractors.length).toBeLessThan(100)
  })
})
