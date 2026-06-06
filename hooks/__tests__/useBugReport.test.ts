// ─────────────────────────────────────────────
// File: hooks/__tests__/useBugReport.test.ts
// Purpose: Tests for the useBugReport hook. Validates submit state
//          transitions (idle -> submitting -> success/error) and
//          client-side cooldown behaviour.
// Depends on: hooks/useBugReport.ts
// ─────────────────────────────────────────────

// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

// ── Mocks ─────────────────────────────────────

const mockSubmitBugReport = vi.fn()

vi.mock('@/services/bug-report.service', () => ({
  submitBugReport: (...args: unknown[]): ReturnType<typeof mockSubmitBugReport> =>
    mockSubmitBugReport(...args),
}))

// ── Fixtures ──────────────────────────────────

const APP_STATE = { page: '/practice', input_mode: 'tap' } as const
const VALID_INPUT = { type: 'bug' as const, description: 'Test bug' }

// ── Tests ─────────────────────────────────────

describe('useBugReport', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  it('starts in idle state', async () => {
    const { useBugReport } = await import('../useBugReport')
    const { result } = renderHook(() => useBugReport())

    expect(result.current.status).toBe('idle')
    expect(result.current.error).toBeNull()
    expect(result.current.cooldownActive).toBe(false)
  })

  it('transitions to submitting then success', async () => {
    mockSubmitBugReport.mockResolvedValue({ ok: true })

    const { useBugReport } = await import('../useBugReport')
    const { result } = renderHook(() => useBugReport())

    await act(async () => {
      await result.current.submit(VALID_INPUT, APP_STATE)
    })

    expect(result.current.status).toBe('success')
    expect(result.current.error).toBeNull()
  })

  it('transitions to error on failure', async () => {
    mockSubmitBugReport.mockResolvedValue({
      ok: false,
      error: 'Server error',
      status: 500,
    })

    const { useBugReport } = await import('../useBugReport')
    const { result } = renderHook(() => useBugReport())

    await act(async () => {
      await result.current.submit(VALID_INPUT, APP_STATE)
    })

    expect(result.current.status).toBe('error')
    expect(result.current.error).toBe('Server error')
  })

  it('activates cooldown after success', async () => {
    mockSubmitBugReport.mockResolvedValue({ ok: true })

    const { useBugReport } = await import('../useBugReport')
    const { result } = renderHook(() => useBugReport())

    await act(async () => {
      await result.current.submit(VALID_INPUT, APP_STATE)
    })

    expect(result.current.cooldownActive).toBe(true)
  })

  it('clears cooldown after 30 seconds', async () => {
    mockSubmitBugReport.mockResolvedValue({ ok: true })

    const { useBugReport } = await import('../useBugReport')
    const { result } = renderHook(() => useBugReport())

    await act(async () => {
      await result.current.submit(VALID_INPUT, APP_STATE)
    })

    expect(result.current.cooldownActive).toBe(true)

    act(() => {
      vi.advanceTimersByTime(30_000)
    })

    expect(result.current.cooldownActive).toBe(false)
  })

  it('does not submit during cooldown', async () => {
    mockSubmitBugReport.mockResolvedValue({ ok: true })

    const { useBugReport } = await import('../useBugReport')
    const { result } = renderHook(() => useBugReport())

    await act(async () => {
      await result.current.submit(VALID_INPUT, APP_STATE)
    })

    mockSubmitBugReport.mockClear()

    await act(async () => {
      await result.current.submit(VALID_INPUT, APP_STATE)
    })

    expect(mockSubmitBugReport).not.toHaveBeenCalled()
  })

  it('resets state to idle', async () => {
    mockSubmitBugReport.mockResolvedValue({
      ok: false,
      error: 'Failed',
      status: 500,
    })

    const { useBugReport } = await import('../useBugReport')
    const { result } = renderHook(() => useBugReport())

    await act(async () => {
      await result.current.submit(VALID_INPUT, APP_STATE)
    })

    expect(result.current.status).toBe('error')

    act(() => {
      result.current.reset()
    })

    expect(result.current.status).toBe('idle')
    expect(result.current.error).toBeNull()
  })
})
