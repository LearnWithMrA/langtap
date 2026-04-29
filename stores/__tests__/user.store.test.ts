// ------------------------------------------------------------
// File: stores/__tests__/user.store.test.ts
// Purpose: Tests for the user store. Validates state management
//          for auth user, profile, loading, and clear.
// Depends on: stores/user.store.ts
// ------------------------------------------------------------

import { describe, it, expect, beforeEach } from 'vitest'
import { useUserStore } from '../user.store'

// ── Helpers ───────────────────────────────────

const MOCK_USER = { id: 'abc-123', email: 'test@example.com' }

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

describe('useUserStore', () => {
  beforeEach(() => {
    useUserStore.setState({ user: null, profile: null, isLoading: true })
  })

  it('starts with null user, null profile, and loading true', () => {
    const state = useUserStore.getState()
    expect(state.user).toBeNull()
    expect(state.profile).toBeNull()
    expect(state.isLoading).toBe(true)
  })

  it('sets user', () => {
    useUserStore.getState().setUser(MOCK_USER)
    expect(useUserStore.getState().user).toEqual(MOCK_USER)
  })

  it('sets profile', () => {
    useUserStore.getState().setProfile(MOCK_PROFILE)
    expect(useUserStore.getState().profile).toEqual(MOCK_PROFILE)
  })

  it('sets loading to false', () => {
    useUserStore.getState().setLoading(false)
    expect(useUserStore.getState().isLoading).toBe(false)
  })

  it('clears user and profile', () => {
    useUserStore.getState().setUser(MOCK_USER)
    useUserStore.getState().setProfile(MOCK_PROFILE)
    useUserStore.getState().clear()
    expect(useUserStore.getState().user).toBeNull()
    expect(useUserStore.getState().profile).toBeNull()
  })

  it('clear does not reset isLoading', () => {
    useUserStore.getState().setLoading(false)
    useUserStore.getState().clear()
    expect(useUserStore.getState().isLoading).toBe(false)
  })

  it('sets user to null for sign-out', () => {
    useUserStore.getState().setUser(MOCK_USER)
    useUserStore.getState().setUser(null)
    expect(useUserStore.getState().user).toBeNull()
  })
})
