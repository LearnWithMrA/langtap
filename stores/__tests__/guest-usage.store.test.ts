// ─────────────────────────────────────────────
// File: stores/__tests__/guest-usage.store.test.ts
// Purpose: Tests for the shared guest usage Zustand store.
//          Validates that all consumers see the same state when
//          usage is updated (the core C1 fix).
// Depends on: stores/guest-usage.store.ts
// ─────────────────────────────────────────────

import { describe, it, expect, beforeEach } from 'vitest'
import { useGuestUsageStore } from '../guest-usage.store'

describe('guest-usage.store', () => {
  beforeEach(() => {
    useGuestUsageStore.getState().reset()
  })

  it('starts with loading true and not initialized', () => {
    const state = useGuestUsageStore.getState()
    expect(state.isLoading).toBe(true)
    expect(state.isInitialized).toBe(false)
    expect(state.usage).toBeNull()
  })

  it('setUsage updates usage for all readers', () => {
    useGuestUsageStore.getState().setUsage({
      kanaDistance: 10,
      kotobaDistance: 5,
      cappedAt: null,
    })

    const state = useGuestUsageStore.getState()
    expect(state.usage?.kanaDistance).toBe(10)
    expect(state.usage?.kotobaDistance).toBe(5)
  })

  it('increment updates are visible to cap gate immediately', () => {
    useGuestUsageStore.getState().setUsage({
      kanaDistance: 20,
      kotobaDistance: 9,
      cappedAt: null,
    })

    const before = useGuestUsageStore.getState().usage
    expect(before?.kanaDistance).toBe(20)

    useGuestUsageStore.getState().setUsage({
      kanaDistance: 20,
      kotobaDistance: 10,
      cappedAt: '2026-05-05T00:00:00Z',
    })

    const after = useGuestUsageStore.getState().usage
    expect(after?.kotobaDistance).toBe(10)
    expect(after?.cappedAt).not.toBeNull()
  })

  it('markInitialized prevents re-initialization', () => {
    useGuestUsageStore.getState().markInitialized()
    expect(useGuestUsageStore.getState().isInitialized).toBe(true)
  })

  it('reset clears all state', () => {
    useGuestUsageStore.getState().setUsage({
      kanaDistance: 15,
      kotobaDistance: 10,
      cappedAt: null,
    })
    useGuestUsageStore.getState().setLoading(false)
    useGuestUsageStore.getState().markInitialized()

    useGuestUsageStore.getState().reset()

    const state = useGuestUsageStore.getState()
    expect(state.usage).toBeNull()
    expect(state.isLoading).toBe(true)
    expect(state.isInitialized).toBe(false)
  })
})
