// ─────────────────────────────────────────────
// File: app/api/auth/sign-out/__tests__/route.test.ts
// Purpose: Security tests for the sign-out route handler.
//          Cross-origin POSTs must be rejected with 403; same-origin
//          POSTs sign out and redirect with 303.
// ─────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach } from 'vitest'

const signOutMock = vi.fn().mockResolvedValue({ error: null })

vi.mock('@/services/supabase-server', () => ({
  createServerSupabaseClient: vi.fn().mockResolvedValue({
    auth: { signOut: (...args: unknown[]): unknown => signOutMock(...args) },
  }),
}))

import { POST } from '../route'

const SITE = 'https://langtap.vercel.app'

// The fetch Request constructor silently strips forbidden headers like
// Origin, so a real Request cannot simulate a cross-site browser POST.
// The handler only reads .url and .headers, so a minimal stub suffices.
function makeRequest(headers: Record<string, string>): Request {
  return {
    url: `${SITE}/api/auth/sign-out`,
    headers: new Headers(headers),
  } as Request
}

describe('POST /api/auth/sign-out', () => {
  beforeEach(() => {
    signOutMock.mockClear()
  })

  it('rejects a cross-origin POST with 403 and does not sign out', async () => {
    const res = await POST(makeRequest({ origin: 'https://evil.com' }))
    expect(res.status).toBe(403)
    expect(signOutMock).not.toHaveBeenCalled()
  })

  it('rejects a cross-site Sec-Fetch-Site POST with 403', async () => {
    const res = await POST(makeRequest({ 'sec-fetch-site': 'cross-site' }))
    expect(res.status).toBe(403)
    expect(signOutMock).not.toHaveBeenCalled()
  })

  it('signs out and redirects with 303 for a same-origin POST', async () => {
    const res = await POST(makeRequest({ origin: SITE, 'sec-fetch-site': 'same-origin' }))
    expect(res.status).toBe(303)
    expect(res.headers.get('location')).toBe(`${SITE}/`)
    expect(signOutMock).toHaveBeenCalledTimes(1)
  })

  it('allows a POST with no origin header (non-browser client, form fallback)', async () => {
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(303)
    expect(signOutMock).toHaveBeenCalledTimes(1)
  })
})
