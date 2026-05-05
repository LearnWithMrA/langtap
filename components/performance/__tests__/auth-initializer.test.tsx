// @vitest-environment jsdom
// ─────────────────────────────────────────────
// File: components/performance/__tests__/auth-initializer.test.tsx
// Purpose: Tests for AuthInitializer. Validates single getUser()
//          call, immediate loading=false after identity resolves,
//          profile loading as background operation, and cleanup.
// Depends on: components/performance/auth-initializer.tsx,
//             stores/user.store.ts
// ─────────────────────────────────────────────

import { render, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useUserStore } from '@/stores/user.store'
import { AuthInitializer } from '../auth-initializer'

// ── Mocks ─────────────────────────────────────

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

// ── Tests ─────────────────────────────────────

describe('AuthInitializer', () => {
  beforeEach(() => {
    useUserStore.setState({ user: null, profile: null, isLoading: true })
    vi.clearAllMocks()
  })

  it('sets loading false immediately after identity resolves (no user)', async () => {
    mockGetUser.mockResolvedValue({ user: null })

    render(<AuthInitializer />)

    await waitFor(() => {
      expect(useUserStore.getState().isLoading).toBe(false)
    })

    expect(useUserStore.getState().user).toBeNull()
    expect(mockGetUser).toHaveBeenCalledOnce()
  })

  it('sets user and loading false before profile loads', async () => {
    let resolveProfile: (v: unknown) => void = () => {}
    const profilePromise = new Promise((resolve) => {
      resolveProfile = resolve
    })

    mockGetUser.mockResolvedValue({ user: MOCK_USER })
    mockLoadProfile.mockReturnValue(profilePromise)

    render(<AuthInitializer />)

    await waitFor(() => {
      expect(useUserStore.getState().isLoading).toBe(false)
    })

    expect(useUserStore.getState().user).toEqual(MOCK_USER)
    expect(useUserStore.getState().profile).toBeNull()

    resolveProfile({ ok: true, data: MOCK_PROFILE })

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
})
