// @vitest-environment jsdom
// ─────────────────────────────────────────────
// File: hooks/__tests__/useDailyCapAnalytics.test.ts
// Purpose: Tests for the daily_cap_hit analytics observer - fires only
//          on the false-to-true cap transition, at most once per day.
// Depends on: hooks/useDailyCapAnalytics.ts
// ─────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

const trackEventMock = vi.fn()

vi.mock('@/services/analytics.service', () => ({
  trackEvent: (...args: unknown[]): unknown => trackEventMock(...args),
  ANALYTICS_EVENTS: { DAILY_CAP_HIT: 'daily_cap_hit' },
}))

import { useDailyCapAnalytics } from '../useDailyCapAnalytics'
import { useDailyCapStore } from '@/stores/daily-cap.store'

function setCapped(isCapped: boolean): void {
  useDailyCapStore.getState().setCapState({
    totalToday: isCapped ? 100 : 50,
    isCapped,
    capAmount: 100,
    capEnabled: true,
  })
}

describe('useDailyCapAnalytics', () => {
  beforeEach(() => {
    trackEventMock.mockReset()
    localStorage.clear()
    useDailyCapStore.getState().reset()
  })

  it('does not fire while uncapped', () => {
    renderHook(() => useDailyCapAnalytics())
    act(() => setCapped(false))
    expect(trackEventMock).not.toHaveBeenCalled()
  })

  it('fires once when the cap transitions from false to true', () => {
    renderHook(() => useDailyCapAnalytics())
    act(() => setCapped(false))
    act(() => setCapped(true))
    expect(trackEventMock).toHaveBeenCalledWith('daily_cap_hit')
    expect(trackEventMock).toHaveBeenCalledTimes(1)
  })

  it('does not fire again for repeated capped states', () => {
    renderHook(() => useDailyCapAnalytics())
    act(() => setCapped(false))
    act(() => setCapped(true))
    act(() => setCapped(true))
    expect(trackEventMock).toHaveBeenCalledTimes(1)
  })

  it('does not fire twice on the same day across transitions', () => {
    renderHook(() => useDailyCapAnalytics())
    act(() => setCapped(false))
    act(() => setCapped(true))
    act(() => setCapped(false))
    act(() => setCapped(true))
    expect(trackEventMock).toHaveBeenCalledTimes(1)
  })

  it('does not fire when already capped on mount (no transition observed)', () => {
    setCapped(true)
    renderHook(() => useDailyCapAnalytics())
    expect(trackEventMock).not.toHaveBeenCalled()
  })
})
