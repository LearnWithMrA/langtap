// ─────────────────────────────────────────────
// File: stores/__tests__/daily-cap.store.test.ts
// Purpose: Unit tests for the daily cap Zustand store.
//          Covers state transitions, shared state visibility,
//          initialization flag, and reset.
// Depends on: stores/daily-cap.store.ts, vitest
// ─────────────────────────────────────────────

import { beforeEach, describe, expect, it } from 'vitest'
import { useDailyCapStore } from '../daily-cap.store'

describe('daily-cap.store', () => {
  beforeEach(() => {
    useDailyCapStore.getState().reset()
  })

  it('starts with loading true and no cap state', () => {
    const state = useDailyCapStore.getState()
    expect(state.isLoading).toBe(true)
    expect(state.isInitialized).toBe(false)
    expect(state.capState).toBeNull()
  })

  it('setCapState updates cap state', () => {
    useDailyCapStore.getState().setCapState({
      totalToday: 50,
      isCapped: false,
      capAmount: 100,
      capEnabled: true,
    })
    expect(useDailyCapStore.getState().capState!.totalToday).toBe(50)
    expect(useDailyCapStore.getState().capState!.isCapped).toBe(false)
  })

  it('setCapState reflects capped state', () => {
    useDailyCapStore.getState().setCapState({
      totalToday: 120,
      isCapped: true,
      capAmount: 100,
      capEnabled: true,
    })
    expect(useDailyCapStore.getState().capState!.isCapped).toBe(true)
  })

  it('setLoading updates loading', () => {
    useDailyCapStore.getState().setLoading(false)
    expect(useDailyCapStore.getState().isLoading).toBe(false)
  })

  it('markInitialized sets flag', () => {
    useDailyCapStore.getState().markInitialized()
    expect(useDailyCapStore.getState().isInitialized).toBe(true)
  })

  it('reset clears all state', () => {
    useDailyCapStore.getState().setCapState({
      totalToday: 80,
      isCapped: false,
      capAmount: 100,
      capEnabled: true,
    })
    useDailyCapStore.getState().setLoading(false)
    useDailyCapStore.getState().markInitialized()
    useDailyCapStore.getState().reset()

    const state = useDailyCapStore.getState()
    expect(state.capState).toBeNull()
    expect(state.isLoading).toBe(true)
    expect(state.isInitialized).toBe(false)
  })
})
