// @vitest-environment jsdom
// ─────────────────────────────────────────────
// File: hooks/__tests__/useFirstPracticeEvent.test.ts
// Purpose: Tests for the once-per-user first_practice analytics event.
// Depends on: hooks/useFirstPracticeEvent.ts
// ─────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'

const trackEventMock = vi.fn()

vi.mock('@/services/analytics.service', () => ({
  trackEvent: (...args: unknown[]): unknown => trackEventMock(...args),
  ANALYTICS_EVENTS: { FIRST_PRACTICE: 'first_practice' },
}))

vi.mock('@/stores/scoped-storage', () => ({
  getStorageUserId: (): string => 'user-123',
}))

import { useFirstPracticeEvent } from '../useFirstPracticeEvent'

describe('useFirstPracticeEvent', () => {
  beforeEach(() => {
    trackEventMock.mockReset()
    localStorage.clear()
  })

  it('fires the event on first call and sets the flag', () => {
    const { result } = renderHook(() => useFirstPracticeEvent('kana'))
    result.current.recordFirstPractice()
    expect(trackEventMock).toHaveBeenCalledWith('first_practice', { game_type: 'kana' })
    expect(localStorage.getItem('langtap-analytics-first-practice-user-123')).toBeTruthy()
  })

  it('is a no-op on subsequent calls', () => {
    const { result } = renderHook(() => useFirstPracticeEvent('kana'))
    result.current.recordFirstPractice()
    result.current.recordFirstPractice()
    result.current.recordFirstPractice()
    expect(trackEventMock).toHaveBeenCalledTimes(1)
  })

  it('is a no-op when the flag was set in a previous session', () => {
    localStorage.setItem('langtap-analytics-first-practice-user-123', '2026-06-11')
    const { result } = renderHook(() => useFirstPracticeEvent('kotoba'))
    result.current.recordFirstPractice()
    expect(trackEventMock).not.toHaveBeenCalled()
  })
})
