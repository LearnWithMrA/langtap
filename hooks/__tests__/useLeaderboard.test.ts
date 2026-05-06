// ─────────────────────────────────────────────
// File: hooks/__tests__/useLeaderboard.test.ts
// Purpose: Tests for useLeaderboard hook. Validates loading
//          states, data resolution, error handling, param
//          changes triggering refetch, and cache behaviour.
// Depends on: hooks/useLeaderboard.ts,
//             services/leaderboard.service.ts
// ─────────────────────────────────────────────

import { renderHook, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks ─────────────────────────────────────

const mockLoadLeaderboard = vi.fn()

vi.mock('@/services/leaderboard.service', () => ({
  loadLeaderboard: (...args: unknown[]): unknown => mockLoadLeaderboard(...args),
}))

// ── Helpers ───────────────────────────────────

function makeBoardResult(entries: Array<{ rank: number; username: string; score: number }>): {
  ok: true
  data: {
    entries: Array<{ rank: number; username: string; score: number; isCurrentUser: boolean }>
    currentUserPinned: null
  }
} {
  return {
    ok: true as const,
    data: {
      entries: entries.map((e) => ({ ...e, isCurrentUser: false })),
      currentUserPinned: null,
    },
  }
}

// ── Tests ─────────────────────────────────────

describe('useLeaderboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('returns isLoading true before data resolves', async () => {
    let resolve: (v: unknown) => void
    mockLoadLeaderboard.mockReturnValue(
      new Promise((r) => {
        resolve = r
      }),
    )

    const { useLeaderboard } = await import('../useLeaderboard')
    const { result } = renderHook(() => useLeaderboard('kana', 'tap', 'all-time'))

    expect(result.current.isLoading).toBe(true)
    expect(result.current.board).toBeNull()

    await act(async () => {
      resolve!(makeBoardResult([{ rank: 1, username: 'a', score: 10 }]))
    })
  })

  it('returns board with entries after data resolves', async () => {
    const boardData = makeBoardResult([
      { rank: 1, username: 'alpha', score: 100 },
      { rank: 2, username: 'beta', score: 80 },
    ])
    mockLoadLeaderboard.mockResolvedValue(boardData)

    const { useLeaderboard } = await import('../useLeaderboard')
    const { result } = renderHook(() => useLeaderboard('kana', 'tap', 'all-time'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.board).toEqual(boardData.data)
    expect(result.current.error).toBeNull()
  })

  it('returns error string when service fails', async () => {
    mockLoadLeaderboard.mockResolvedValue({ ok: false, error: 'Network error' })

    const { useLeaderboard } = await import('../useLeaderboard')
    const { result } = renderHook(() => useLeaderboard('kana', 'type', 'all-time'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBe('Network error')
    expect(result.current.board).toBeNull()
  })

  it('changing inputMode triggers new fetch', async () => {
    mockLoadLeaderboard.mockResolvedValue(makeBoardResult([]))

    const { useLeaderboard } = await import('../useLeaderboard')
    const { result, rerender } = renderHook(
      ({ mode }) => useLeaderboard('kana', mode, 'all-time'),
      { initialProps: { mode: 'tap' as const } },
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(mockLoadLeaderboard).toHaveBeenCalledWith('kana', 'tap', 'all-time')

    rerender({ mode: 'type' as const })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(mockLoadLeaderboard).toHaveBeenCalledWith('kana', 'type', 'all-time')
  })

  it('changing timePeriod triggers new fetch', async () => {
    mockLoadLeaderboard.mockResolvedValue(makeBoardResult([]))

    const { useLeaderboard } = await import('../useLeaderboard')
    const { result, rerender } = renderHook(({ period }) => useLeaderboard('kana', 'tap', period), {
      initialProps: { period: 'all-time' as const },
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    rerender({ period: 'this-week' as const })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(mockLoadLeaderboard).toHaveBeenCalledWith('kana', 'tap', 'this-week')
  })

  it('changing gameType triggers new fetch', async () => {
    mockLoadLeaderboard.mockResolvedValue(makeBoardResult([]))

    const { useLeaderboard } = await import('../useLeaderboard')
    const { result, rerender } = renderHook(({ game }) => useLeaderboard(game, 'tap', 'all-time'), {
      initialProps: { game: 'kana' as const },
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    rerender({ game: 'kotoba' as const })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(mockLoadLeaderboard).toHaveBeenCalledWith('kotoba', 'tap', 'all-time')
  })

  it('cache hit returns data without refetching', async () => {
    const boardData = makeBoardResult([{ rank: 1, username: 'cached', score: 50 }])
    mockLoadLeaderboard.mockResolvedValue(boardData)

    const { useLeaderboard } = await import('../useLeaderboard')

    const { result: first } = renderHook(() => useLeaderboard('kana', 'tap', 'all-time'))
    await waitFor(() => expect(first.current.isLoading).toBe(false))
    expect(mockLoadLeaderboard).toHaveBeenCalledTimes(1)

    const { result: second } = renderHook(() => useLeaderboard('kana', 'tap', 'all-time'))
    expect(second.current.isLoading).toBe(false)
    expect(second.current.board).toEqual(boardData.data)
    expect(mockLoadLeaderboard).toHaveBeenCalledTimes(1)
  })
})
