// ------------------------------------------------------------
// File: stores/__tests__/counter.store.test.ts
// Purpose: Tests for the word counter Zustand store.
//          Session-scoped (in-memory only, no persist).
// Depends on: stores/counter.store.ts
// ------------------------------------------------------------

import { describe, it, expect, beforeEach } from 'vitest'
import { useCounterStore } from '@/stores/counter.store'

// ── Helpers ──────────────────────────────────

function resetStore(): void {
  useCounterStore.setState({ counters: {} })
}

// ── Tests ────────────────────────────────────

describe('counter store', () => {
  beforeEach(() => {
    resetStore()
  })

  describe('initial state', () => {
    it('starts with an empty counters map', () => {
      expect(useCounterStore.getState().counters).toEqual({})
    })
  })

  describe('increment', () => {
    it('creates a new entry at 1', () => {
      useCounterStore.getState().increment('word-1')
      expect(useCounterStore.getState().counters['word-1']).toBe(1)
    })

    it('increments an existing entry', () => {
      useCounterStore.setState({ counters: { 'word-1': 3 } })
      useCounterStore.getState().increment('word-1')
      expect(useCounterStore.getState().counters['word-1']).toBe(4)
    })

    it('caps at MAX_WORD_COUNTER', () => {
      useCounterStore.setState({ counters: { 'word-1': 5 } })
      useCounterStore.getState().increment('word-1')
      expect(useCounterStore.getState().counters['word-1']).toBe(5)
    })
  })

  describe('resetForCharacter', () => {
    it('resets specified word IDs', () => {
      useCounterStore.setState({ counters: { 'w-1': 5, 'w-2': 3 } })
      useCounterStore.getState().resetForCharacter(['w-1', 'w-2'])
      expect(useCounterStore.getState().counters['w-1']).toBe(0)
      expect(useCounterStore.getState().counters['w-2']).toBe(0)
    })

    it('preserves other word counters', () => {
      useCounterStore.setState({ counters: { 'w-1': 5, 'w-other': 3 } })
      useCounterStore.getState().resetForCharacter(['w-1'])
      expect(useCounterStore.getState().counters['w-other']).toBe(3)
    })
  })

  describe('bulkLoad', () => {
    it('replaces entire counter map', () => {
      useCounterStore.setState({ counters: { old: 3 } })
      useCounterStore.getState().bulkLoad({ 'new-1': 2, 'new-2': 4 })
      expect(useCounterStore.getState().counters).toEqual({ 'new-1': 2, 'new-2': 4 })
    })

    it('handles empty incoming map', () => {
      useCounterStore.setState({ counters: { 'w-1': 3 } })
      useCounterStore.getState().bulkLoad({})
      expect(useCounterStore.getState().counters).toEqual({})
    })
  })

  describe('resetAll', () => {
    it('clears all counters', () => {
      useCounterStore.setState({ counters: { 'w-1': 5, 'w-2': 3 } })
      useCounterStore.getState().resetAll()
      expect(useCounterStore.getState().counters).toEqual({})
    })
  })

  describe('getCounter', () => {
    it('returns 0 for unknown word ID', () => {
      expect(useCounterStore.getState().getCounter('nonexistent')).toBe(0)
    })

    it('returns current counter for known word', () => {
      useCounterStore.setState({ counters: { 'w-1': 3 } })
      expect(useCounterStore.getState().getCounter('w-1')).toBe(3)
    })
  })
})
