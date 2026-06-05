// @vitest-environment jsdom
// ─────────────────────────────────────────────
// File: hooks/__tests__/usePracticeActivityTracker.test.ts
// Purpose: Tests for the practice activity tracker hook.
//          Validates batching thresholds, timer-based flush,
//          guest no-op, flush on unmount, and failure restoration.
// Depends on: hooks/usePracticeActivityTracker.ts
// ─────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

// ── Mocks ─────────────────────────────────────

const mockRecordPracticeActivity = vi.fn()

vi.mock('@/services/practice-session.service', () => ({
  recordPracticeActivity: (...args: unknown[]): unknown => mockRecordPracticeActivity(...args),
}))

// ── Setup ─────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers()
  vi.stubGlobal('crypto', { randomUUID: () => 'test-uuid-1234' })
  mockRecordPracticeActivity.mockResolvedValue({ ok: true, data: {} })
})

afterEach(() => {
  vi.useRealTimers()
})

// ── Tests ─────────────────────────────────────

describe('usePracticeActivityTracker', () => {
  it('does not flush before reaching threshold', async () => {
    const { usePracticeActivityTracker } = await import('../usePracticeActivityTracker')
    const { result } = renderHook(() => usePracticeActivityTracker(false))

    act(() => {
      result.current.trackCompletion(3)
    })

    expect(mockRecordPracticeActivity).not.toHaveBeenCalled()
  })

  it('flushes when reaching the 10-completion threshold', async () => {
    const { usePracticeActivityTracker } = await import('../usePracticeActivityTracker')
    const { result } = renderHook(() => usePracticeActivityTracker(false))

    await act(async () => {
      for (let i = 0; i < 10; i++) {
        result.current.trackCompletion(1)
      }
    })

    expect(mockRecordPracticeActivity).toHaveBeenCalledTimes(1)
    expect(mockRecordPracticeActivity).toHaveBeenCalledWith('test-uuid-1234', 10)
  })

  it('flushes with batch count when a single call exceeds threshold', async () => {
    const { usePracticeActivityTracker } = await import('../usePracticeActivityTracker')
    const { result } = renderHook(() => usePracticeActivityTracker(false))

    await act(async () => {
      result.current.trackCompletion(15)
    })

    expect(mockRecordPracticeActivity).toHaveBeenCalledWith('test-uuid-1234', 15)
  })

  it('flushes after 30s timer when below threshold', async () => {
    const { usePracticeActivityTracker } = await import('../usePracticeActivityTracker')
    const { result } = renderHook(() => usePracticeActivityTracker(false))

    act(() => {
      result.current.trackCompletion(3)
    })

    expect(mockRecordPracticeActivity).not.toHaveBeenCalled()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000)
    })

    expect(mockRecordPracticeActivity).toHaveBeenCalledTimes(1)
    expect(mockRecordPracticeActivity).toHaveBeenCalledWith('test-uuid-1234', 3)
  })

  it('does nothing for guests', async () => {
    const { usePracticeActivityTracker } = await import('../usePracticeActivityTracker')
    const { result } = renderHook(() => usePracticeActivityTracker(true))

    act(() => {
      result.current.trackCompletion(20)
    })

    expect(mockRecordPracticeActivity).not.toHaveBeenCalled()
  })

  it('flushes remaining on unmount', async () => {
    const { usePracticeActivityTracker } = await import('../usePracticeActivityTracker')
    const { result, unmount } = renderHook(() => usePracticeActivityTracker(false))

    act(() => {
      result.current.trackCompletion(5)
    })

    expect(mockRecordPracticeActivity).not.toHaveBeenCalled()

    unmount()

    expect(mockRecordPracticeActivity).toHaveBeenCalledTimes(1)
    expect(mockRecordPracticeActivity).toHaveBeenCalledWith('test-uuid-1234', 5)
  })

  it('does not flush on unmount if nothing pending', async () => {
    const { usePracticeActivityTracker } = await import('../usePracticeActivityTracker')
    const { unmount } = renderHook(() => usePracticeActivityTracker(false))

    unmount()

    expect(mockRecordPracticeActivity).not.toHaveBeenCalled()
  })

  it('restores pending count on RPC failure so unmount retries', async () => {
    mockRecordPracticeActivity.mockResolvedValueOnce({ ok: false, error: 'Network error' })

    const { usePracticeActivityTracker } = await import('../usePracticeActivityTracker')
    const { result, unmount } = renderHook(() => usePracticeActivityTracker(false))

    await act(async () => {
      result.current.trackCompletion(10)
    })

    expect(mockRecordPracticeActivity).toHaveBeenCalledTimes(1)

    mockRecordPracticeActivity.mockResolvedValue({ ok: true, data: {} })
    unmount()

    expect(mockRecordPracticeActivity).toHaveBeenCalledTimes(2)
    expect(mockRecordPracticeActivity).toHaveBeenLastCalledWith('test-uuid-1234', 10)
  })

  it('restores pending count on RPC exception so unmount retries', async () => {
    mockRecordPracticeActivity.mockRejectedValueOnce(new Error('Network down'))

    const { usePracticeActivityTracker } = await import('../usePracticeActivityTracker')
    const { result, unmount } = renderHook(() => usePracticeActivityTracker(false))

    await act(async () => {
      result.current.trackCompletion(10)
    })

    expect(mockRecordPracticeActivity).toHaveBeenCalledTimes(1)

    mockRecordPracticeActivity.mockResolvedValue({ ok: true, data: {} })
    unmount()

    expect(mockRecordPracticeActivity).toHaveBeenCalledTimes(2)
    expect(mockRecordPracticeActivity).toHaveBeenLastCalledWith('test-uuid-1234', 10)
  })
})
