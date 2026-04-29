// ------------------------------------------------------------
// File: engine/__tests__/scoring.test.ts
// Purpose: Tests for per-character first-attempt scoring logic.
// Depends on: engine/scoring.ts
// ------------------------------------------------------------

import { describe, it, expect } from 'vitest'
import { evaluateCharacterAttempt, evaluateWordResult } from '@/engine/scoring'

// ── evaluateCharacterAttempt ─────────────────

describe('evaluateCharacterAttempt', () => {
  it('returns 1 for correct first attempt', () => {
    expect(evaluateCharacterAttempt(true, true)).toBe(1)
  })

  it('returns 0 for incorrect first attempt', () => {
    expect(evaluateCharacterAttempt(true, false)).toBe(0)
  })

  it('returns 0 for correct reattempt', () => {
    expect(evaluateCharacterAttempt(false, true)).toBe(0)
  })

  it('returns 0 for incorrect reattempt', () => {
    expect(evaluateCharacterAttempt(false, false)).toBe(0)
  })
})

// ── evaluateWordResult ───────────────────────

describe('evaluateWordResult', () => {
  it('awards 1 point to each character when all correct first attempt', () => {
    const result = evaluateWordResult([
      { characterId: 'h-a', isFirstAttemptCorrect: true },
      { characterId: 'h-ka', isFirstAttemptCorrect: true },
    ])
    expect(result).toEqual({ 'h-a': 1, 'h-ka': 1 })
  })

  it('awards 0 points to characters with incorrect first attempts', () => {
    const result = evaluateWordResult([
      { characterId: 'h-a', isFirstAttemptCorrect: false },
      { characterId: 'h-ka', isFirstAttemptCorrect: false },
    ])
    expect(result).toEqual({ 'h-a': 0, 'h-ka': 0 })
  })

  it('handles mixed results', () => {
    const result = evaluateWordResult([
      { characterId: 'h-a', isFirstAttemptCorrect: true },
      { characterId: 'h-ka', isFirstAttemptCorrect: false },
      { characterId: 'h-sa', isFirstAttemptCorrect: true },
    ])
    expect(result).toEqual({ 'h-a': 1, 'h-ka': 0, 'h-sa': 1 })
  })

  it('awards 0 to all characters when all incorrect', () => {
    const result = evaluateWordResult([{ characterId: 'h-a', isFirstAttemptCorrect: false }])
    expect(result).toEqual({ 'h-a': 0 })
  })

  describe('duplicate characters in a word', () => {
    it('awards 1 point if any occurrence was first-attempt correct', () => {
      const result = evaluateWordResult([
        { characterId: 'h-a', isFirstAttemptCorrect: false },
        { characterId: 'h-ka', isFirstAttemptCorrect: true },
        { characterId: 'h-a', isFirstAttemptCorrect: true },
      ])
      expect(result['h-a']).toBe(1)
    })

    it('awards 0 points if all occurrences were incorrect', () => {
      const result = evaluateWordResult([
        { characterId: 'h-a', isFirstAttemptCorrect: false },
        { characterId: 'h-a', isFirstAttemptCorrect: false },
      ])
      expect(result['h-a']).toBe(0)
    })

    it('awards 1 point even if later occurrence was incorrect but first was correct', () => {
      const result = evaluateWordResult([
        { characterId: 'h-a', isFirstAttemptCorrect: true },
        { characterId: 'h-a', isFirstAttemptCorrect: false },
      ])
      expect(result['h-a']).toBe(1)
    })
  })

  describe('edge cases', () => {
    it('handles empty character results array', () => {
      const result = evaluateWordResult([])
      expect(result).toEqual({})
    })

    it('handles single character word', () => {
      const result = evaluateWordResult([{ characterId: 'h-a', isFirstAttemptCorrect: true }])
      expect(result).toEqual({ 'h-a': 1 })
    })
  })
})
