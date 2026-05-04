// ─────────────────────────────────────────────
// File: services/__tests__/guest-usage.service.test.ts
// Purpose: Tests for the guest usage service. Covers session
//          creation, usage loading, and increment via RPC mocks.
// Depends on: services/guest-usage.service.ts
// ─────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Supabase mock ─────────────────────────────

const mockGetUser = vi.fn()
const mockSignInAnonymously = vi.fn()
const mockRpc = vi.fn()

vi.mock('@/services/supabase-browser', () => ({
  createBrowserSupabaseClient: (): unknown => ({
    auth: {
      getUser: mockGetUser,
      signInAnonymously: mockSignInAnonymously,
    },
    rpc: mockRpc,
  }),
}))

// ── Tests ─────────────────────────────────────

describe('guest-usage.service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('ensureGuestSession', () => {
    it('does not sign in if user already exists', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'abc' } } })
      const { ensureGuestSession } = await import('../guest-usage.service')
      const result = await ensureGuestSession()
      expect(result.ok).toBe(true)
      expect(mockSignInAnonymously).not.toHaveBeenCalled()
    })

    it('signs in anonymously when no user exists', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } })
      mockSignInAnonymously.mockResolvedValue({ error: null })
      const { ensureGuestSession } = await import('../guest-usage.service')
      const result = await ensureGuestSession()
      expect(result.ok).toBe(true)
      expect(mockSignInAnonymously).toHaveBeenCalledOnce()
    })

    it('returns error when anonymous sign-in fails', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } })
      mockSignInAnonymously.mockResolvedValue({ error: { message: 'rate limited' } })
      const { ensureGuestSession } = await import('../guest-usage.service')
      const result = await ensureGuestSession()
      expect(result.ok).toBe(false)
      expect(result.error).toBe('rate limited')
    })
  })

  describe('loadGuestUsage', () => {
    it('returns usage from RPC', async () => {
      mockRpc.mockResolvedValue({
        data: [{ kana_distance: 10, kotoba_distance: 5, capped_at: null }],
        error: null,
      })
      const { loadGuestUsage } = await import('../guest-usage.service')
      const result = await loadGuestUsage()
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data.kanaDistance).toBe(10)
        expect(result.data.kotobaDistance).toBe(5)
        expect(result.data.cappedAt).toBeNull()
      }
    })

    it('returns error on RPC failure', async () => {
      mockRpc.mockResolvedValue({ data: null, error: { message: 'db error' } })
      const { loadGuestUsage } = await import('../guest-usage.service')
      const result = await loadGuestUsage()
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.error).toBe('db error')
    })
  })

  describe('incrementGuestUsage', () => {
    it('calls RPC with game type and metres', async () => {
      mockRpc.mockResolvedValue({
        data: [{ kana_distance: 11, kotoba_distance: 5, capped_at: null }],
        error: null,
      })
      const { incrementGuestUsage } = await import('../guest-usage.service')
      const result = await incrementGuestUsage('kana', 1)
      expect(mockRpc).toHaveBeenCalledWith('increment_guest_usage', {
        p_game_type: 'kana',
        p_metres: 1,
      })
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.data.kanaDistance).toBe(11)
    })

    it('does not call RPC for zero or negative metres', async () => {
      mockRpc.mockResolvedValue({
        data: [{ kana_distance: 10, kotoba_distance: 5, capped_at: null }],
        error: null,
      })
      const { incrementGuestUsage } = await import('../guest-usage.service')
      await incrementGuestUsage('kana', 0)
      expect(mockRpc).toHaveBeenCalledWith('get_or_create_guest_usage')
    })
  })
})
