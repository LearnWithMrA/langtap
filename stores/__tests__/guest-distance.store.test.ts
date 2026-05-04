// @vitest-environment jsdom
// ─────────────────────────────────────────────
// File: stores/__tests__/guest-distance.store.test.ts
// Purpose: Tests for the guest distance store.
//          Verifies per-gameType tracking and independence.
// Depends on: stores/guest-distance.store.ts
// ─────────────────────────────────────────────

import { describe, it, expect, beforeEach } from 'vitest'
import { useGuestDistanceStore } from '../guest-distance.store'

describe('useGuestDistanceStore', () => {
  beforeEach(() => {
    useGuestDistanceStore.setState({ distances: { kana: 0, kotoba: 0 } })
  })

  it('starts at zero for both game types', () => {
    expect(useGuestDistanceStore.getState().getDistance('kana')).toBe(0)
    expect(useGuestDistanceStore.getState().getDistance('kotoba')).toBe(0)
  })

  it('adds distance to kana independently', () => {
    useGuestDistanceStore.getState().addDistance('kana', 5)
    expect(useGuestDistanceStore.getState().getDistance('kana')).toBe(5)
    expect(useGuestDistanceStore.getState().getDistance('kotoba')).toBe(0)
  })

  it('adds distance to kotoba independently', () => {
    useGuestDistanceStore.getState().addDistance('kotoba', 3)
    expect(useGuestDistanceStore.getState().getDistance('kana')).toBe(0)
    expect(useGuestDistanceStore.getState().getDistance('kotoba')).toBe(3)
  })

  it('accumulates distance across multiple adds', () => {
    useGuestDistanceStore.getState().addDistance('kana', 5)
    useGuestDistanceStore.getState().addDistance('kana', 7)
    expect(useGuestDistanceStore.getState().getDistance('kana')).toBe(12)
  })
})
