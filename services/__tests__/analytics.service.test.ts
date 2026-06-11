// ─────────────────────────────────────────────
// File: services/__tests__/analytics.service.test.ts
// Purpose: Tests for the Vercel Analytics wrapper - event forwarding
//          and the never-throw guarantee.
// ─────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach } from 'vitest'

const trackMock = vi.fn()

vi.mock('@vercel/analytics', () => ({
  track: (...args: unknown[]): unknown => trackMock(...args),
}))

import { trackEvent, ANALYTICS_EVENTS } from '../analytics.service'

describe('analytics.service', () => {
  beforeEach(() => {
    trackMock.mockReset()
  })

  it('forwards the event name and properties to track', () => {
    trackEvent(ANALYTICS_EVENTS.SIGN_UP, { method: 'email' })
    expect(trackMock).toHaveBeenCalledWith('sign_up', { method: 'email' })
  })

  it('forwards events without properties', () => {
    trackEvent(ANALYTICS_EVENTS.DAILY_CAP_HIT)
    expect(trackMock).toHaveBeenCalledWith('daily_cap_hit', undefined)
  })

  it('never throws when the underlying track call fails', () => {
    trackMock.mockImplementation(() => {
      throw new Error('network down')
    })
    expect(() => trackEvent(ANALYTICS_EVENTS.FIRST_PRACTICE)).not.toThrow()
  })

  it('exposes exactly the four budgeted event names', () => {
    expect(Object.values(ANALYTICS_EVENTS).sort()).toEqual([
      'daily_cap_hit',
      'first_practice',
      'sign_up',
      'trial_complete',
    ])
  })
})
