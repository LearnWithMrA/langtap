// ------------------------------------------------------------
// File: stores/__tests__/word-mastery.store.test.ts
// Purpose: Tests for the word mastery Zustand store.
//          Covers: increment, getScore, reset, resetAll, bulkLoad,
//          hydration state, and input sanitization.
// Depends on: stores/word-mastery.store.ts
// ------------------------------------------------------------

import { describe, it, expect, beforeEach } from 'vitest'
import { useWordMasteryStore } from '@/stores/word-mastery.store'

// ── Helpers ──────────────────────────────────

function resetStore(): void {
  useWordMasteryStore.setState({ scores: {}, hasHydrated: false })
}

// ── Tests ────────────────────────────────────

describe('word mastery store', () => {
  beforeEach(() => {
    resetStore()
  })

  // -- Initial state --

  describe('initial state', () => {
    it('starts with an empty scores map', () => {
      const { scores } = useWordMasteryStore.getState()
      expect(scores).toEqual({})
    })

    it('starts with hasHydrated false', () => {
      const { hasHydrated } = useWordMasteryStore.getState()
      expect(hasHydrated).toBe(false)
    })
  })

  // -- increment --

  describe('increment', () => {
    it('creates a new entry at 1 when the word has no prior score', () => {
      useWordMasteryStore.getState().increment('1198180')
      expect(useWordMasteryStore.getState().scores['1198180']).toBe(1)
    })

    it('adds 1 to an existing score', () => {
      useWordMasteryStore.setState({ scores: { '1198180': 5 } })
      useWordMasteryStore.getState().increment('1198180')
      expect(useWordMasteryStore.getState().scores['1198180']).toBe(6)
    })

    it('increments multiple different words independently', () => {
      useWordMasteryStore.getState().increment('1198180')
      useWordMasteryStore.getState().increment('1381380')
      useWordMasteryStore.getState().increment('1198180')
      expect(useWordMasteryStore.getState().scores['1198180']).toBe(2)
      expect(useWordMasteryStore.getState().scores['1381380']).toBe(1)
    })

    it('has no upper bound on score', () => {
      useWordMasteryStore.setState({ scores: { '1198180': 999 } })
      useWordMasteryStore.getState().increment('1198180')
      expect(useWordMasteryStore.getState().scores['1198180']).toBe(1000)
    })
  })

  // -- getScore --

  describe('getScore', () => {
    it('returns 0 for an unknown word ID', () => {
      expect(useWordMasteryStore.getState().getScore('nonexistent')).toBe(0)
    })

    it('returns the current score for a known word', () => {
      useWordMasteryStore.setState({ scores: { '1198180': 7 } })
      expect(useWordMasteryStore.getState().getScore('1198180')).toBe(7)
    })
  })

  // -- reset --

  describe('reset', () => {
    it('sets a word score to 0', () => {
      useWordMasteryStore.setState({ scores: { '1198180': 10 } })
      useWordMasteryStore.getState().reset('1198180')
      expect(useWordMasteryStore.getState().scores['1198180']).toBe(0)
    })

    it('does not remove the key from the map', () => {
      useWordMasteryStore.setState({ scores: { '1198180': 10 } })
      useWordMasteryStore.getState().reset('1198180')
      expect('1198180' in useWordMasteryStore.getState().scores).toBe(true)
    })

    it('does not affect other words', () => {
      useWordMasteryStore.setState({ scores: { '1198180': 10, '1381380': 5 } })
      useWordMasteryStore.getState().reset('1198180')
      expect(useWordMasteryStore.getState().scores['1381380']).toBe(5)
    })
  })

  // -- resetAll --

  describe('resetAll', () => {
    it('clears all scores to an empty map', () => {
      useWordMasteryStore.setState({ scores: { '1198180': 10, '1381380': 5 } })
      useWordMasteryStore.getState().resetAll()
      expect(useWordMasteryStore.getState().scores).toEqual({})
    })

    it('getScore returns 0 for previously scored words after resetAll', () => {
      useWordMasteryStore.setState({ scores: { '1198180': 10 } })
      useWordMasteryStore.getState().resetAll()
      expect(useWordMasteryStore.getState().getScore('1198180')).toBe(0)
    })
  })

  // -- bulkLoad --

  describe('bulkLoad', () => {
    it('loads scores into an empty store', () => {
      useWordMasteryStore.getState().bulkLoad({ '1198180': 3, '1381380': 7 })
      expect(useWordMasteryStore.getState().scores).toEqual({ '1198180': 3, '1381380': 7 })
    })

    it('uses max(local, incoming) for matching keys', () => {
      useWordMasteryStore.setState({ scores: { '1198180': 12 } })
      useWordMasteryStore.getState().bulkLoad({ '1198180': 3 })
      expect(useWordMasteryStore.getState().scores['1198180']).toBe(12)
    })

    it('takes incoming value when it is higher', () => {
      useWordMasteryStore.setState({ scores: { '1198180': 3 } })
      useWordMasteryStore.getState().bulkLoad({ '1198180': 12 })
      expect(useWordMasteryStore.getState().scores['1198180']).toBe(12)
    })

    it('preserves existing scores for keys not in the incoming map', () => {
      useWordMasteryStore.setState({ scores: { '1198180': 5, '1381380': 3 } })
      useWordMasteryStore.getState().bulkLoad({ '1383240': 2 })
      expect(useWordMasteryStore.getState().scores['1198180']).toBe(5)
      expect(useWordMasteryStore.getState().scores['1381380']).toBe(3)
      expect(useWordMasteryStore.getState().scores['1383240']).toBe(2)
    })

    it('handles an empty incoming map without clearing existing scores', () => {
      useWordMasteryStore.setState({ scores: { '1198180': 5 } })
      useWordMasteryStore.getState().bulkLoad({})
      expect(useWordMasteryStore.getState().scores['1198180']).toBe(5)
    })

    it('sanitizes NaN values to 0', () => {
      useWordMasteryStore.getState().bulkLoad({ '1198180': NaN })
      expect(useWordMasteryStore.getState().scores['1198180']).toBe(0)
    })

    it('sanitizes Infinity values to 0', () => {
      useWordMasteryStore.getState().bulkLoad({ '1198180': Infinity })
      expect(useWordMasteryStore.getState().scores['1198180']).toBe(0)
    })

    it('sanitizes negative values to 0', () => {
      useWordMasteryStore.getState().bulkLoad({ '1198180': -5 })
      expect(useWordMasteryStore.getState().scores['1198180']).toBe(0)
    })

    it('sanitizes fractional values to integers', () => {
      useWordMasteryStore.getState().bulkLoad({ '1198180': 3.7 })
      expect(useWordMasteryStore.getState().scores['1198180']).toBe(3)
    })

    it('is idempotent for the same payload', () => {
      useWordMasteryStore.getState().bulkLoad({ '1198180': 5, '1381380': 3 })
      useWordMasteryStore.getState().bulkLoad({ '1198180': 5, '1381380': 3 })
      expect(useWordMasteryStore.getState().scores).toEqual({ '1198180': 5, '1381380': 3 })
    })
  })

  // -- hasEncountered --

  describe('hasEncountered', () => {
    it('returns false for unknown word ID', () => {
      expect(useWordMasteryStore.getState().hasEncountered('1198180')).toBe(false)
    })

    it('returns false for word with score 0', () => {
      useWordMasteryStore.setState({ scores: { '1198180': 0 } })
      expect(useWordMasteryStore.getState().hasEncountered('1198180')).toBe(false)
    })

    it('returns true for word with score > 0', () => {
      useWordMasteryStore.setState({ scores: { '1198180': 1 } })
      expect(useWordMasteryStore.getState().hasEncountered('1198180')).toBe(true)
    })
  })
})
