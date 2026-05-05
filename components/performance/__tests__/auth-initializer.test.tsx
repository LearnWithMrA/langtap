// ────────────────────���────────────────────────
// File: components/performance/__tests__/auth-initializer.test.tsx
// Purpose: Tests for AuthInitializer. Validates loading resolves
//          under real React.StrictMode (double-fire) and with
//          deferred getUser() that settles after first cleanup.
//          Would fail if initRef guard were restored.
// Depends on: components/performance/auth-initializer.tsx,
//             stores/user.store.ts, test-utils/async-gate.tsx
// ──────────────────────────────────────���──────

import React from 'react'
import { render, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useUserStore } from '@/stores/user.store'
import { AuthInitializer } from '../auth-initializer'
import { deferred } from '@/test-utils/async-gate'

// ── Mocks ────────���────────────────────────────

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

const mockGetUser = vi.fn()
const mockLoadProfile = vi.fn()
const mockUnsubscribe = vi.fn()

vi.mock('@/services/auth.service', () => ({
  getUser: (): Promise<{ user: unknown }> => mockGetUser(),
}))

vi.mock('@/services/profile.service', () => ({
  loadProfile: (...args: unknown[]): Promise<unknown> => mockLoadProfile(...args),
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

// ── Tests ──────���──────────────────────────────

describe('AuthInitializer', () => {
  beforeEach(() => {
    useUserStore.setState({ user: null, profile: null, isLoading: true, isProfileLoaded: false })
    vi.clearAllMocks()
  })

  it('sets loading false immediately after identity resolves (no user)', async () => {
    mockGetUser.mockResolvedValue({ user: null })

    render(<AuthInitializer />)

    await waitFor(() => {
      expect(useUserStore.getState().isLoading).toBe(false)
    })

    expect(useUserStore.getState().user).toBeNull()
  })

  it('sets user and loading false before profile loads', async () => {
    const profileDeferred = deferred<unknown>()

    mockGetUser.mockResolvedValue({ user: MOCK_USER })
    mockLoadProfile.mockReturnValue(profileDeferred.promise)

    render(<AuthInitializer />)

    await waitFor(() => {
      expect(useUserStore.getState().isLoading).toBe(false)
    })

    expect(useUserStore.getState().user).toEqual(MOCK_USER)
    expect(useUserStore.getState().profile).toBeNull()

    profileDeferred.resolve({ ok: true, data: MOCK_PROFILE })

    await waitFor(() => {
      expect(useUserStore.getState().profile).toEqual(MOCK_PROFILE)
    })
  })

  it('cleans up subscription on unmount', async () => {
    mockGetUser.mockResolvedValue({ user: null })

    const { unmount } = render(<AuthInitializer />)

    await waitFor(() => {
      expect(useUserStore.getState().isLoading).toBe(false)
    })

    unmount()
    expect(mockUnsubscribe).toHaveBeenCalled()
  })

  it('renders nothing', () => {
    mockGetUser.mockResolvedValue({ user: null })

    const { container } = render(<AuthInitializer />)
    expect(container.firstChild).toBeNull()
  })

  it('resolves loading under real StrictMode with deferred getUser', async () => {
    const getUserDeferred = deferred<{ user: unknown }>()
    mockGetUser.mockReturnValue(getUserDeferred.promise)

    render(
      <React.StrictMode>
        <AuthInitializer />
      </React.StrictMode>,
    )

    expect(useUserStore.getState().isLoading).toBe(true)

    getUserDeferred.resolve({ user: null })

    await waitFor(() => {
      expect(useUserStore.getState().isLoading).toBe(false)
    })
  })

  it('resolves loading under real StrictMode with authenticated user', async () => {
    const getUserDeferred = deferred<{ user: unknown }>()
    const profileDeferred = deferred<unknown>()
    mockGetUser.mockReturnValue(getUserDeferred.promise)
    mockLoadProfile.mockReturnValue(profileDeferred.promise)

    render(
      <React.StrictMode>
        <AuthInitializer />
      </React.StrictMode>,
    )

    getUserDeferred.resolve({ user: MOCK_USER })

    await waitFor(() => {
      expect(useUserStore.getState().isLoading).toBe(false)
    })

    expect(useUserStore.getState().user).toEqual(MOCK_USER)

    profileDeferred.resolve({ ok: true, data: MOCK_PROFILE })

    await waitFor(() => {
      expect(useUserStore.getState().profile).toEqual(MOCK_PROFILE)
    })
  })

  it('resolves after unmount/remount without store reset', async () => {
    mockGetUser.mockResolvedValue({ user: null })

    const { unmount } = render(<AuthInitializer />)
    unmount()

    // DO NOT reset store. If the old initRef guard existed, the second
    // mount would skip init and isLoading would stay true forever.

    render(<AuthInitializer />)

    await waitFor(() => {
      expect(useUserStore.getState().isLoading).toBe(false)
    })
  })

  it('sets isProfileLoaded true after successful profile load', async () => {
    mockGetUser.mockResolvedValue({ user: MOCK_USER })
    mockLoadProfile.mockResolvedValue({ ok: true, data: MOCK_PROFILE })

    render(<AuthInitializer />)

    await waitFor(() => {
      expect(useUserStore.getState().isProfileLoaded).toBe(true)
    })

    expect(useUserStore.getState().profile).toEqual(MOCK_PROFILE)
  })

  it('sets isProfileLoaded true even when profile load fails', async () => {
    mockGetUser.mockResolvedValue({ user: MOCK_USER })
    mockLoadProfile.mockResolvedValue({ ok: false, error: 'network error' })

    render(<AuthInitializer />)

    await waitFor(() => {
      expect(useUserStore.getState().isProfileLoaded).toBe(true)
    })

    expect(useUserStore.getState().profile).toBeNull()
  })
})
