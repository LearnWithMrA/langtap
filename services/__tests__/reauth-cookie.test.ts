// ─────────────────────────────────────────────
// File: services/__tests__/reauth-cookie.test.ts
// Purpose: Unit tests for the HMAC-SHA256 signed cookie utility.
//          Covers sign/verify round-trip, expiry enforcement,
//          tamper detection, and purpose mismatch rejection.
// Depends on: services/reauth-cookie.ts, vitest
// ─────────────────────────────────────────────

import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createPendingToken,
  verifyPendingToken,
  createVerifiedToken,
  verifyVerifiedToken,
} from '../reauth-cookie'

// ── Setup ─────────────────────────────────────

beforeEach(() => {
  vi.stubEnv('AUTH_REAUTH_COOKIE_SECRET', 'test-secret-that-is-at-least-32-characters-long!!')
})

// ── Pending token tests ──────────────────────

describe('pending token', () => {
  it('round-trips a valid pending token', async () => {
    const token = await createPendingToken('user-1', 'google')
    const payload = await verifyPendingToken(token)
    expect(payload).not.toBeNull()
    expect(payload!.userId).toBe('user-1')
    expect(payload!.provider).toBe('google')
    expect(payload!.purpose).toBe('delete-reauth-pending')
  })

  it('rejects a tampered token', async () => {
    const token = await createPendingToken('user-1', 'google')
    const tampered = token.slice(0, -4) + 'xxxx'
    const payload = await verifyPendingToken(tampered)
    expect(payload).toBeNull()
  })

  it('rejects an expired token', async () => {
    vi.useFakeTimers()
    const token = await createPendingToken('user-1', 'google')
    vi.advanceTimersByTime(301_000)
    const payload = await verifyPendingToken(token)
    expect(payload).toBeNull()
    vi.useRealTimers()
  })

  it('rejects a verified token when checking as pending', async () => {
    const token = await createVerifiedToken('user-1', 'google')
    const payload = await verifyPendingToken(token)
    expect(payload).toBeNull()
  })

  it('rejects an empty string', async () => {
    const payload = await verifyPendingToken('')
    expect(payload).toBeNull()
  })

  it('rejects a string without a dot separator', async () => {
    const payload = await verifyPendingToken('nodothere')
    expect(payload).toBeNull()
  })
})

// ── Verified token tests ─────────────────────

describe('verified token', () => {
  it('round-trips a valid verified token', async () => {
    const token = await createVerifiedToken('user-2', 'apple')
    const payload = await verifyVerifiedToken(token)
    expect(payload).not.toBeNull()
    expect(payload!.userId).toBe('user-2')
    expect(payload!.provider).toBe('apple')
    expect(payload!.purpose).toBe('delete-reauth-verified')
    expect(payload!.verifiedAt).toBeGreaterThan(0)
  })

  it('rejects a pending token when checking as verified', async () => {
    const token = await createPendingToken('user-1', 'google')
    const payload = await verifyVerifiedToken(token)
    expect(payload).toBeNull()
  })

  it('rejects an expired verified token', async () => {
    vi.useFakeTimers()
    const token = await createVerifiedToken('user-1', 'google')
    vi.advanceTimersByTime(301_000)
    const payload = await verifyVerifiedToken(token)
    expect(payload).toBeNull()
    vi.useRealTimers()
  })
})

// ── Secret validation ────────────────────────

describe('secret validation', () => {
  it('throws when secret is missing', async () => {
    vi.stubEnv('AUTH_REAUTH_COOKIE_SECRET', '')
    await expect(createPendingToken('u', 'g')).rejects.toThrow('AUTH_REAUTH_COOKIE_SECRET')
  })

  it('throws when secret is too short', async () => {
    vi.stubEnv('AUTH_REAUTH_COOKIE_SECRET', 'short')
    await expect(createPendingToken('u', 'g')).rejects.toThrow('at least 32 characters')
  })
})
