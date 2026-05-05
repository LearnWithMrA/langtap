// ─────────────────────────────────────────────
// File: hooks/__tests__/useGuestUsage.test.ts
// Purpose: Regression tests for useGuestUsage. Uses real
//          React.StrictMode and deferred promises to prove async
//          gates resolve under double-fire conditions. Tests would
//          fail if markInitialized() were moved back before async.
// Depends on: hooks/useGuestUsage.ts, stores/guest-usage.store.ts,
//             stores/user.store.ts, test-utils/async-gate.tsx
// ─────────────────────────────────────────��───

import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useGuestUsageStore } from '@/stores/guest-usage.store'
import { useUserStore } from '@/stores/user.store'
import { useGuestUsage } from '../useGuestUsage'
import { deferred, renderHookStrict, expectLoadingClears } from '@/test-utils/async-gate'

// ── Mocks ─────────────────────────────────────

const mockEnsureGuestSession = vi.fn()
const mockLoadGuestUsage = vi.fn()

vi.mock('@/services/guest-usage.service', () => ({
  ensureGuestSession: (): Promise<unknown> => mockEnsureGuestSession(),
  loadGuestUsage: (): Promise<unknown> => mockLoadGuestUsage(),
  incrementGuestUsage: vi.fn(),
}))

vi.mock('@/engine/constants', () => ({
  GUEST_TRIAL_DISTANCE_CAP: 1800,
}))

// ── Helpers ────────────────────────���──────────

function setAuthResolved(isAnonymous = false): void {
  useUserStore.setState({
    user: isAnonymous ? { id: 'anon-1', email: undefined, isAnonymous: true } : null,
    profile: null,
    isLoading: false,
  })
}

// ── Tests ─────────────────���───────────────────

describe('useGuestUsage', () => {
  beforeEach(() => {
    useUserStore.setState({ user: null, profile: null, isLoading: true })
    useGuestUsageStore.getState().reset()
    vi.clearAllMocks()
  })

  it('returns isLoading true while auth is loading', () => {
    const { result } = renderHook(() => useGuestUsage())
    expect(result.current.isLoading).toBe(true)
  })

  it('resolves isLoading false for non-guest users', async () => {
    useUserStore.setState({
      user: { id: 'user-1', email: 'a@b.com', isAnonymous: false },
      profile: null,
      isLoading: false,
    })

    const { result } = renderHook(() => useGuestUsage())
    await expectLoadingClears(result)
  })

  it('resolves isLoading false after successful guest init', async () => {
    setAuthResolved()
    mockEnsureGuestSession.mockResolvedValue({ ok: true })
    mockLoadGuestUsage.mockResolvedValue({
      ok: true,
      data: { kanaDistance: 0, kotobaDistance: 0, cappedAt: null },
    })

    const { result } = renderHook(() => useGuestUsage())
    await expectLoadingClears(result)

    expect(result.current.usage).toEqual({
      kanaDistance: 0,
      kotobaDistance: 0,
      cappedAt: null,
    })
  })

  it('resolves isLoading false when ensureGuestSession fails', async () => {
    setAuthResolved()
    mockEnsureGuestSession.mockResolvedValue({ ok: false, error: 'network' })

    const { result } = renderHook(() => useGuestUsage())
    await expectLoadingClears(result)
  })

  it('resolves isLoading false when loadGuestUsage fails', async () => {
    setAuthResolved()
    mockEnsureGuestSession.mockResolvedValue({ ok: true })
    mockLoadGuestUsage.mockResolvedValue({ ok: false, error: 'rpc error' })

    const { result } = renderHook(() => useGuestUsage())
    await expectLoadingClears(result)
  })

  it('resolves under real StrictMode with deferred async', async () => {
    setAuthResolved()

    const sessionDeferred = deferred<{ ok: boolean }>()
    const usageDeferred = deferred<{ ok: boolean; data: unknown }>()

    mockEnsureGuestSession.mockReturnValue(sessionDeferred.promise)
    mockLoadGuestUsage.mockReturnValue(usageDeferred.promise)

    const { result } = renderHookStrict(() => useGuestUsage())

    expect(result.current.isLoading).toBe(true)

    act(() => {
      sessionDeferred.resolve({ ok: true })
    })
    await vi.waitFor(() => expect(mockLoadGuestUsage).toHaveBeenCalled())

    act(() => {
      usageDeferred.resolve({
        ok: true,
        data: { kanaDistance: 50, kotobaDistance: 0, cappedAt: null },
      })
    })

    await expectLoadingClears(result)
    expect(result.current.usage).toEqual({
      kanaDistance: 50,
      kotobaDistance: 0,
      cappedAt: null,
    })
  })

  it('resolves after unmount/remount WITHOUT store reset (Strict Mode regression)', async () => {
    setAuthResolved()
    mockEnsureGuestSession.mockResolvedValue({ ok: true })
    mockLoadGuestUsage.mockResolvedValue({
      ok: true,
      data: { kanaDistance: 100, kotobaDistance: 50, cappedAt: null },
    })

    // First mount then immediate unmount
    const { unmount } = renderHook(() => useGuestUsage())
    unmount()

    // DO NOT reset store. The bug was: isInitialized=true + isLoading=true stuck.
    // If markInitialized fires only after async completes, unmount leaves
    // isInitialized=false, so the second mount can re-init.

    const { result } = renderHook(() => useGuestUsage())
    await expectLoadingClears(result)

    expect(result.current.usage).toEqual({
      kanaDistance: 100,
      kotobaDistance: 50,
      cappedAt: null,
    })
  })

  it('does not leave store stuck when multiple consumers mount', async () => {
    setAuthResolved()
    mockEnsureGuestSession.mockResolvedValue({ ok: true })
    mockLoadGuestUsage.mockResolvedValue({
      ok: true,
      data: { kanaDistance: 0, kotobaDistance: 0, cappedAt: null },
    })

    const hook1 = renderHook(() => useGuestUsage())
    const hook2 = renderHook(() => useGuestUsage())

    await expectLoadingClears(hook1.result)
    await expectLoadingClears(hook2.result)
  })

  it('calculates isOverCap correctly', async () => {
    setAuthResolved()
    mockEnsureGuestSession.mockResolvedValue({ ok: true })
    mockLoadGuestUsage.mockResolvedValue({
      ok: true,
      data: { kanaDistance: 1000, kotobaDistance: 800, cappedAt: null },
    })

    const { result } = renderHook(() => useGuestUsage())
    await expectLoadingClears(result)
    expect(result.current.isOverCap).toBe(true)
  })

  it('resolves after auth transitions from loading to guest', async () => {
    mockEnsureGuestSession.mockResolvedValue({ ok: true })
    mockLoadGuestUsage.mockResolvedValue({
      ok: true,
      data: { kanaDistance: 0, kotobaDistance: 0, cappedAt: null },
    })

    const { result, rerender } = renderHook(() => useGuestUsage())
    expect(result.current.isLoading).toBe(true)

    act(() => {
      setAuthResolved()
    })
    rerender()

    await expectLoadingClears(result)
  })
})
