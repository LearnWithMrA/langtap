// ─────────────────────────────────────────────
// File: services/__tests__/membership.service.test.ts
// Purpose: Tests for membership status derivation - active windows,
//          expiry, lifetime, and display labels.
// ─────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import { isActiveMembership, getMembershipStatus } from '../membership.service'

const NOW = new Date('2026-06-11T12:00:00Z')
const FUTURE = '2026-07-11T12:00:00Z'
const PAST = '2026-05-11T12:00:00Z'

describe('isActiveMembership', () => {
  it('free is never active', () => {
    expect(isActiveMembership('free', null, NOW)).toBe(false)
    expect(isActiveMembership('free', FUTURE, NOW)).toBe(false)
  })

  it('lifetime is always active regardless of expiry', () => {
    expect(isActiveMembership('lifetime', null, NOW)).toBe(true)
    expect(isActiveMembership('lifetime', PAST, NOW)).toBe(true)
  })

  it('monthly and annual are active only with a future expiry', () => {
    expect(isActiveMembership('monthly', FUTURE, NOW)).toBe(true)
    expect(isActiveMembership('annual', FUTURE, NOW)).toBe(true)
    expect(isActiveMembership('monthly', PAST, NOW)).toBe(false)
    expect(isActiveMembership('annual', PAST, NOW)).toBe(false)
    expect(isActiveMembership('monthly', null, NOW)).toBe(false)
  })
})

describe('getMembershipStatus', () => {
  it('returns free for a null profile', () => {
    const status = getMembershipStatus(null, NOW)
    expect(status).toEqual({
      tier: 'free',
      isActive: false,
      label: 'Free',
      priceLabel: '$0 / month',
    })
  })

  it('returns the active paid tier with its label', () => {
    const status = getMembershipStatus(
      { membershipTier: 'lifetime', membershipExpiresAt: null },
      NOW,
    )
    expect(status.tier).toBe('lifetime')
    expect(status.isActive).toBe(true)
    expect(status.label).toBe('Lifetime')
  })

  it('displays an expired paid tier as free', () => {
    const status = getMembershipStatus(
      { membershipTier: 'monthly', membershipExpiresAt: PAST },
      NOW,
    )
    expect(status.tier).toBe('free')
    expect(status.isActive).toBe(false)
    expect(status.label).toBe('Free')
  })

  it('displays an active monthly tier with the price', () => {
    const status = getMembershipStatus(
      { membershipTier: 'monthly', membershipExpiresAt: FUTURE },
      NOW,
    )
    expect(status.tier).toBe('monthly')
    expect(status.priceLabel).toBe('$2.99 / month')
  })
})
