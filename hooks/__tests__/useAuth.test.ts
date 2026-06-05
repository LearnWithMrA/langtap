// ------------------------------------------------------------
// File: hooks/__tests__/useAuth.test.ts
// Purpose: Tests for the useAuth hook. useAuth is a pure Zustand
//          selector. Tests validate state derivation from the store,
//          not initialization logic (which lives in AuthInitializer).
// Depends on: hooks/useAuth.ts, stores/user.store.ts
// ------------------------------------------------------------

// @vitest-environment jsdom

import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useUserStore } from '@/stores/user.store'
import { useAuth } from '../useAuth'

// ── Fixtures ─────────────────────────────────

const MOCK_USER = { id: 'abc-123', email: 'test@example.com', isAnonymous: false }

const MOCK_PROFILE = {
  id: 'abc-123',
  username: 'testuser',
  jlptLevel: 'N5' as const,
  inputMode: 'tap' as const,
  onboardingComplete: false,
  notificationsEnabled: false,
  distanceUnit: 'metric' as const,
  usernameChangedAt: null,
  createdAt: '2026-04-01T00:00:00Z',
}

// ── Tests ─────────────────────────────────────

describe('useAuth', () => {
  beforeEach(() => {
    useUserStore.setState({ user: null, profile: null, isLoading: true })
  })

  it('returns loading state when store is loading', () => {
    const { result } = renderHook(() => useAuth())

    expect(result.current.isLoading).toBe(true)
    expect(result.current.isGuest).toBe(false)
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('returns isGuest true when no user and not loading', () => {
    useUserStore.setState({ user: null, profile: null, isLoading: false })
    const { result } = renderHook(() => useAuth())

    expect(result.current.isGuest).toBe(true)
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
  })

  it('returns isAuthenticated true when user exists', () => {
    useUserStore.setState({ user: MOCK_USER, profile: MOCK_PROFILE, isLoading: false })
    const { result } = renderHook(() => useAuth())

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.isGuest).toBe(false)
    expect(result.current.user).toEqual(MOCK_USER)
    expect(result.current.profile).toEqual(MOCK_PROFILE)
  })

  it('returns isAuthenticated true even without profile', () => {
    useUserStore.setState({ user: MOCK_USER, profile: null, isLoading: false })
    const { result } = renderHook(() => useAuth())

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.profile).toBeNull()
  })
})
