// ------------------------------------------------------------
// File: stores/__tests__/mastery.store.test.ts
// Purpose: Tests for the character mastery Zustand store.
//          Covers: increment, getScore, reset, resetAll, bulkLoad,
//          hydration state, and input sanitization.
// Depends on: stores/mastery.store.ts
// ------------------------------------------------------------

import { describe, it, expect, beforeEach } from 'vitest'
import { useMasteryStore } from '@/stores/mastery.store'

// ── Helpers ──────────────────────────────────

function resetStore(): void {
  useMasteryStore.setState({ scores: {}, learningScores: {}, hasHydrated: false })
}

// ── Tests ────────────────────────────────────

describe('mastery store', () => {
  beforeEach(() => {
    resetStore()
  })

  // -- Initial state --

  describe('initial state', () => {
    it('starts with an empty scores map', () => {
      const { scores } = useMasteryStore.getState()
      expect(scores).toEqual({})
    })

    it('starts with hasHydrated false', () => {
      const { hasHydrated } = useMasteryStore.getState()
      expect(hasHydrated).toBe(false)
    })
  })

  // -- increment --

  describe('increment', () => {
    it('creates a new entry at 1 when the character has no prior score', () => {
      useMasteryStore.getState().increment('h-a')
      expect(useMasteryStore.getState().scores['h-a']).toBe(1)
    })

    it('adds 1 to an existing score', () => {
      useMasteryStore.setState({ scores: { 'h-a': 5 } })
      useMasteryStore.getState().increment('h-a')
      expect(useMasteryStore.getState().scores['h-a']).toBe(6)
    })

    it('increments multiple different characters independently', () => {
      useMasteryStore.getState().increment('h-a')
      useMasteryStore.getState().increment('h-ka')
      useMasteryStore.getState().increment('h-a')
      expect(useMasteryStore.getState().scores['h-a']).toBe(2)
      expect(useMasteryStore.getState().scores['h-ka']).toBe(1)
    })

    it('has no upper bound on score', () => {
      useMasteryStore.setState({ scores: { 'h-a': 999 } })
      useMasteryStore.getState().increment('h-a')
      expect(useMasteryStore.getState().scores['h-a']).toBe(1000)
    })
  })

  // -- getScore --

  describe('getScore', () => {
    it('returns 0 for an unknown character ID', () => {
      expect(useMasteryStore.getState().getScore('nonexistent')).toBe(0)
    })

    it('returns the current score for a known character', () => {
      useMasteryStore.setState({ scores: { 'h-a': 7 } })
      expect(useMasteryStore.getState().getScore('h-a')).toBe(7)
    })
  })

  // -- reset --

  describe('reset', () => {
    it('sets a character score to 0', () => {
      useMasteryStore.setState({ scores: { 'h-a': 10 } })
      useMasteryStore.getState().reset('h-a')
      expect(useMasteryStore.getState().scores['h-a']).toBe(0)
    })

    it('does not remove the key from the map', () => {
      useMasteryStore.setState({ scores: { 'h-a': 10 } })
      useMasteryStore.getState().reset('h-a')
      expect('h-a' in useMasteryStore.getState().scores).toBe(true)
    })

    it('does not affect other characters', () => {
      useMasteryStore.setState({ scores: { 'h-a': 10, 'h-ka': 5 } })
      useMasteryStore.getState().reset('h-a')
      expect(useMasteryStore.getState().scores['h-ka']).toBe(5)
    })
  })

  // -- resetAll --

  describe('resetAll', () => {
    it('clears all scores to an empty map', () => {
      useMasteryStore.setState({ scores: { 'h-a': 10, 'h-ka': 5 } })
      useMasteryStore.getState().resetAll()
      expect(useMasteryStore.getState().scores).toEqual({})
    })

    it('getScore returns 0 for previously scored characters after resetAll', () => {
      useMasteryStore.setState({ scores: { 'h-a': 10 } })
      useMasteryStore.getState().resetAll()
      expect(useMasteryStore.getState().getScore('h-a')).toBe(0)
    })
  })

  // -- bulkLoad --

  describe('bulkLoad', () => {
    it('loads scores into an empty store', () => {
      useMasteryStore.getState().bulkLoad({ 'h-a': 3, 'h-ka': 7 })
      expect(useMasteryStore.getState().scores).toEqual({ 'h-a': 3, 'h-ka': 7 })
    })

    it('uses max(local, incoming) for matching keys', () => {
      useMasteryStore.setState({ scores: { 'h-a': 12 } })
      useMasteryStore.getState().bulkLoad({ 'h-a': 3 })
      expect(useMasteryStore.getState().scores['h-a']).toBe(12)
    })

    it('takes incoming value when it is higher', () => {
      useMasteryStore.setState({ scores: { 'h-a': 3 } })
      useMasteryStore.getState().bulkLoad({ 'h-a': 12 })
      expect(useMasteryStore.getState().scores['h-a']).toBe(12)
    })

    it('preserves existing scores for keys not in the incoming map', () => {
      useMasteryStore.setState({ scores: { 'h-a': 5, 'h-ka': 3 } })
      useMasteryStore.getState().bulkLoad({ 'h-sa': 2 })
      expect(useMasteryStore.getState().scores['h-a']).toBe(5)
      expect(useMasteryStore.getState().scores['h-ka']).toBe(3)
      expect(useMasteryStore.getState().scores['h-sa']).toBe(2)
    })

    it('handles an empty incoming map without clearing existing scores', () => {
      useMasteryStore.setState({ scores: { 'h-a': 5 } })
      useMasteryStore.getState().bulkLoad({})
      expect(useMasteryStore.getState().scores['h-a']).toBe(5)
    })

    it('sanitizes NaN values to 0', () => {
      useMasteryStore.getState().bulkLoad({ 'h-a': NaN })
      expect(useMasteryStore.getState().scores['h-a']).toBe(0)
    })

    it('sanitizes Infinity values to 0', () => {
      useMasteryStore.getState().bulkLoad({ 'h-a': Infinity })
      expect(useMasteryStore.getState().scores['h-a']).toBe(0)
    })

    it('sanitizes negative values to 0', () => {
      useMasteryStore.getState().bulkLoad({ 'h-a': -5 })
      expect(useMasteryStore.getState().scores['h-a']).toBe(0)
    })

    it('sanitizes fractional values to integers', () => {
      useMasteryStore.getState().bulkLoad({ 'h-a': 3.7 })
      expect(useMasteryStore.getState().scores['h-a']).toBe(3)
    })

    it('is idempotent for the same payload', () => {
      useMasteryStore.getState().bulkLoad({ 'h-a': 5, 'h-ka': 3 })
      useMasteryStore.getState().bulkLoad({ 'h-a': 5, 'h-ka': 3 })
      expect(useMasteryStore.getState().scores).toEqual({ 'h-a': 5, 'h-ka': 3 })
    })
  })

  // -- hasEncountered --

  describe('hasEncountered', () => {
    it('returns false for unknown character ID', () => {
      expect(useMasteryStore.getState().hasEncountered('h-a')).toBe(false)
    })

    it('returns false for character with score 0', () => {
      useMasteryStore.setState({ scores: { 'h-a': 0 } })
      expect(useMasteryStore.getState().hasEncountered('h-a')).toBe(false)
    })

    it('returns true for character with score > 0', () => {
      useMasteryStore.setState({ scores: { 'h-a': 1 } })
      expect(useMasteryStore.getState().hasEncountered('h-a')).toBe(true)
    })
  })

  // -- Learning scores --

  describe('incrementLearning', () => {
    it('increments learning score for a character', () => {
      useMasteryStore.getState().incrementLearning('h-a')
      expect(useMasteryStore.getState().getLearningScore('h-a')).toBe(1)
    })

    it('accumulates learning score', () => {
      useMasteryStore.getState().incrementLearning('h-a')
      useMasteryStore.getState().incrementLearning('h-a')
      useMasteryStore.getState().incrementLearning('h-a')
      expect(useMasteryStore.getState().getLearningScore('h-a')).toBe(3)
    })

    it('does not affect mastery score', () => {
      useMasteryStore.getState().incrementLearning('h-a')
      expect(useMasteryStore.getState().getScore('h-a')).toBe(0)
    })
  })

  describe('getLearningScore', () => {
    it('returns 0 for unencountered character', () => {
      expect(useMasteryStore.getState().getLearningScore('h-z')).toBe(0)
    })
  })

  describe('reset clears learning scores', () => {
    it('reset() clears both scores and learningScores for a character', () => {
      useMasteryStore.setState({ scores: { 'h-a': 10 }, learningScores: { 'h-a': 5 } })
      useMasteryStore.getState().reset('h-a')
      expect(useMasteryStore.getState().getScore('h-a')).toBe(0)
      expect(useMasteryStore.getState().getLearningScore('h-a')).toBe(0)
    })

    it('resetAll() clears both maps', () => {
      useMasteryStore.setState({
        scores: { 'h-a': 10, 'h-i': 5 },
        learningScores: { 'h-a': 5, 'h-i': 3 },
      })
      useMasteryStore.getState().resetAll()
      expect(useMasteryStore.getState().scores).toEqual({})
      expect(useMasteryStore.getState().learningScores).toEqual({})
    })
  })

  describe('v1 migration', () => {
    it('backfills learningScores from scores capped at 5', () => {
      const v1State = { scores: { 'h-a': 12, 'h-i': 3, 'h-u': 0 } }
      const migrateFn = (
        useMasteryStore as unknown as {
          persist: { getOptions: () => { migrate: (state: unknown, version: number) => unknown } }
        }
      ).persist.getOptions().migrate
      const result = migrateFn(v1State, 1) as { learningScores: Record<string, number> }
      expect(result.learningScores['h-a']).toBe(5)
      expect(result.learningScores['h-i']).toBe(3)
      expect(result.learningScores['h-u']).toBeUndefined()
    })
  })
})
