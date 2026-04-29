// ------------------------------------------------------------
// File: hooks/__tests__/useAuth.test.ts
// Purpose: Tests for the useAuth hook. Validates auth state
//          derivation (isAuthenticated, isGuest) and initial
//          loading behaviour.
// Depends on: hooks/useAuth.ts, stores/user.store.ts
// ------------------------------------------------------------

// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useUserStore } from '@/stores/user.store'

// ── Mocks ─────────────────────────────────────

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

const mockUnsubscribe = vi.fn()

vi.mock('@/services/auth.service', () => ({
  getUser: vi.fn(),
}))

vi.mock('@/services/profile.service', () => ({
  loadProfile: vi.fn(),
}))

vi.mock('@/services/supabase-browser', () => ({
  createBrowserSupabaseClient: vi.fn(() => ({
    auth: {
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: mockUnsubscribe } },
      })),
    },
  })),
}))

// ── Tests ─────────────────────────────────────

describe('useAuth', () => {
  beforeEach(async () => {
    useUserStore.setState({ user: null, profile: null, isLoading: true })
    vi.clearAllMocks()
  })

  it('returns isGuest true when no user and not loading', async () => {
    const { getUser } = await import('@/services/auth.service')
    vi.mocked(getUser).mockResolvedValue({ user: null })

    const { useAuth } = await import('../useAuth')
    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.isGuest).toBe(true)
    expect(result.current.user).toBeNull()
  })

  it('returns isAuthenticated true when user exists', async () => {
    const { getUser } = await import('@/services/auth.service')
    const { loadProfile } = await import('@/services/profile.service')
    vi.mocked(getUser).mockResolvedValue({ user: MOCK_USER })
    vi.mocked(loadProfile).mockResolvedValue({ ok: true, data: MOCK_PROFILE })

    const { useAuth } = await import('../useAuth')
    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.isGuest).toBe(false)
    expect(result.current.user).toEqual(MOCK_USER)
    expect(result.current.profile).toEqual(MOCK_PROFILE)
  })

  it('handles profile load failure gracefully', async () => {
    const { getUser } = await import('@/services/auth.service')
    const { loadProfile } = await import('@/services/profile.service')
    vi.mocked(getUser).mockResolvedValue({ user: MOCK_USER })
    vi.mocked(loadProfile).mockResolvedValue({ ok: false, error: 'Failed.' })

    const { useAuth } = await import('../useAuth')
    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.profile).toBeNull()
  })

  it('unsubscribes from auth changes on unmount', async () => {
    const { getUser } = await import('@/services/auth.service')
    vi.mocked(getUser).mockResolvedValue({ user: null })

    const { useAuth } = await import('../useAuth')
    const { unmount } = renderHook(() => useAuth())

    unmount()

    expect(mockUnsubscribe).toHaveBeenCalled()
  })
})
