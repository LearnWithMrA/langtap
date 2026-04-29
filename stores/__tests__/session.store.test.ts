// ------------------------------------------------------------
// File: stores/__tests__/session.store.test.ts
// Purpose: Tests for the session score Zustand store.
// Depends on: stores/session.store.ts
// ------------------------------------------------------------

import { describe, it, expect, beforeEach } from 'vitest'
import { useSessionStore } from '@/stores/session.store'

// ── Helpers ──────────────────────────────────

function resetStore(): void {
  useSessionStore.getState().reset()
}

// ── Tests ────────────────────────────────────

describe('session store', () => {
  beforeEach(() => {
    resetStore()
  })

  describe('initial state', () => {
    it('starts inactive with zero counters', () => {
      const state = useSessionStore.getState()
      expect(state.isActive).toBe(false)
      expect(state.correctAnswers).toBe(0)
      expect(state.wrongAnswers).toBe(0)
      expect(state.distanceMetres).toBe(0)
      expect(state.durationSeconds).toBe(0)
      expect(state.charactersEncountered.size).toBe(0)
    })
  })

  describe('startSession', () => {
    it('sets isActive to true and resets all counters', () => {
      useSessionStore.getState().recordCorrect('h-a', 10)
      useSessionStore.getState().startSession()
      const state = useSessionStore.getState()
      expect(state.isActive).toBe(true)
      expect(state.correctAnswers).toBe(0)
      expect(state.distanceMetres).toBe(0)
      expect(state.charactersEncountered.size).toBe(0)
    })
  })

  describe('endSession', () => {
    it('sets isActive to false, preserves counters', () => {
      useSessionStore.getState().startSession()
      useSessionStore.getState().recordCorrect('h-a', 15)
      useSessionStore.getState().endSession()
      const state = useSessionStore.getState()
      expect(state.isActive).toBe(false)
      expect(state.correctAnswers).toBe(1)
    })
  })

  describe('recordCorrect', () => {
    it('increments correct count and adds distance', () => {
      useSessionStore.getState().recordCorrect('h-a', 15)
      const state = useSessionStore.getState()
      expect(state.correctAnswers).toBe(1)
      expect(state.distanceMetres).toBe(15)
    })

    it('adds character to encountered set', () => {
      useSessionStore.getState().recordCorrect('h-a', 10)
      expect(useSessionStore.getState().charactersEncountered.has('h-a')).toBe(true)
    })

    it('does not duplicate characters in encountered set', () => {
      useSessionStore.getState().recordCorrect('h-a', 10)
      useSessionStore.getState().recordCorrect('h-a', 10)
      expect(useSessionStore.getState().charactersEncountered.size).toBe(1)
      expect(useSessionStore.getState().correctAnswers).toBe(2)
    })
  })

  describe('recordWrong', () => {
    it('increments wrong count', () => {
      useSessionStore.getState().recordWrong('h-a')
      expect(useSessionStore.getState().wrongAnswers).toBe(1)
    })

    it('does not add distance', () => {
      useSessionStore.getState().recordWrong('h-a')
      expect(useSessionStore.getState().distanceMetres).toBe(0)
    })

    it('adds character to encountered set', () => {
      useSessionStore.getState().recordWrong('h-ka')
      expect(useSessionStore.getState().charactersEncountered.has('h-ka')).toBe(true)
    })
  })

  describe('addDuration', () => {
    it('accumulates duration', () => {
      useSessionStore.getState().addDuration(30)
      useSessionStore.getState().addDuration(15)
      expect(useSessionStore.getState().durationSeconds).toBe(45)
    })
  })

  describe('reset', () => {
    it('clears everything and sets inactive', () => {
      useSessionStore.getState().startSession()
      useSessionStore.getState().recordCorrect('h-a', 20)
      useSessionStore.getState().recordWrong('h-ka')
      useSessionStore.getState().reset()
      const state = useSessionStore.getState()
      expect(state.isActive).toBe(false)
      expect(state.correctAnswers).toBe(0)
      expect(state.wrongAnswers).toBe(0)
      expect(state.distanceMetres).toBe(0)
      expect(state.charactersEncountered.size).toBe(0)
    })
  })
})
