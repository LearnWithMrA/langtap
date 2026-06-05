// @vitest-environment jsdom
// ─────────────────────────────────────────────
// File: hooks/__tests__/useStreak.test.ts
// Purpose: Tests for the useStreak hook. Validates loading state,
//          empty data for guests, streak derivation from server
//          data, and heatmap generation with count-based intensity.
// Depends on: hooks/useStreak.ts
// ─────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

// ── Mocks ─────────────────────────────────────

const mockLoadPracticeSummary = vi.fn()

vi.mock('@/services/streak.service', () => ({
  loadPracticeSummary: (...args: unknown[]): unknown => mockLoadPracticeSummary(...args),
}))

let mockIsGuest = false
let mockIsAuthenticated = true

vi.mock('@/hooks/useAuth', () => ({
  useAuth: (): { isGuest: boolean; isAuthenticated: boolean } => ({
    isGuest: mockIsGuest,
    isAuthenticated: mockIsAuthenticated,
  }),
}))

let mockUserId: string | undefined = 'user-123'
let mockUserTz: string | undefined = 'UTC'

vi.mock('@/stores/user.store', () => ({
  useUserStore: (
    selector: (s: { profile: { id: string; userTz: string } | null }) => unknown,
  ): unknown =>
    selector({ profile: mockUserId ? { id: mockUserId, userTz: mockUserTz ?? 'UTC' } : null }),
}))

// ── Setup ─────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  mockIsGuest = false
  mockIsAuthenticated = true
  mockUserId = 'user-123'
  mockUserTz = 'UTC'
})

// ── Tests ─────────────────────────────────────

describe('useStreak', () => {
  it('returns empty heatmap and 0 streak for guests', async () => {
    mockIsGuest = true
    mockIsAuthenticated = false

    const { useStreak } = await import('../useStreak')
    const { result } = renderHook(() => useStreak())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.heatmap).toEqual([])
    expect(result.current.streakCount).toBe(0)
    expect(mockLoadPracticeSummary).not.toHaveBeenCalled()
  })

  it('returns empty heatmap when not authenticated', async () => {
    mockIsGuest = false
    mockIsAuthenticated = false

    const { useStreak } = await import('../useStreak')
    const { result } = renderHook(() => useStreak())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.heatmap).toEqual([])
    expect(result.current.streakCount).toBe(0)
  })

  it('loads practice summary for authenticated users', async () => {
    mockLoadPracticeSummary.mockResolvedValue({
      ok: true,
      data: [
        { date: '2026-06-03', count: 20 },
        { date: '2026-06-04', count: 15 },
        { date: '2026-06-05', count: 10 },
      ],
    })

    const { useStreak } = await import('../useStreak')
    const { result } = renderHook(() => useStreak())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(mockLoadPracticeSummary).toHaveBeenCalledWith('user-123', expect.any(String))
    expect(result.current.heatmap.length).toBeGreaterThan(0)
  })

  it('derives streak count from practice data', async () => {
    mockLoadPracticeSummary.mockResolvedValue({
      ok: true,
      data: [
        { date: '2026-06-03', count: 5 },
        { date: '2026-06-04', count: 10 },
        { date: '2026-06-05', count: 8 },
      ],
    })

    const { useStreak } = await import('../useStreak')
    const { result } = renderHook(() => useStreak())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // 3 consecutive days meets the STREAK_START_THRESHOLD
    expect(result.current.streakCount).toBe(3)
  })

  it('returns 0 streak when no practice data', async () => {
    mockLoadPracticeSummary.mockResolvedValue({
      ok: true,
      data: [],
    })

    const { useStreak } = await import('../useStreak')
    const { result } = renderHook(() => useStreak())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.streakCount).toBe(0)
  })

  it('includes charactersPracticed in heatmap days', async () => {
    mockLoadPracticeSummary.mockResolvedValue({
      ok: true,
      data: [{ date: '2026-06-05', count: 42 }],
    })

    const { useStreak } = await import('../useStreak')
    const { result } = renderHook(() => useStreak())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    const today = result.current.heatmap.find((d) => d.date === '2026-06-05')
    expect(today?.charactersPracticed).toBe(42)
  })

  it('handles service error gracefully', async () => {
    mockLoadPracticeSummary.mockResolvedValue({
      ok: false,
      error: 'Network error',
    })

    const { useStreak } = await import('../useStreak')
    const { result } = renderHook(() => useStreak())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.heatmap).toEqual([])
    expect(result.current.streakCount).toBe(0)
  })
})
