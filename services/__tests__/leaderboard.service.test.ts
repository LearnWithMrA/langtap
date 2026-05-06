// ------------------------------------------------------------
// File: services/__tests__/leaderboard.service.test.ts
// Purpose: Unit tests for leaderboard service. Validates RPC
//          call params, response transformation to LeaderboardBoard,
//          pinned user separation, and error handling.
// Depends on: services/leaderboard.service.ts
// ------------------------------------------------------------

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks ─────────────────────────────────────

const mockRpc = vi.fn()

vi.mock('@/services/supabase-browser', () => ({
  createBrowserSupabaseClient: vi.fn(() => ({
    rpc: mockRpc,
  })),
}))

// ── Tests ─────────────────────────────────────

describe('leaderboard.service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('recordLeaderboardCompletion', () => {
    it('calls RPC with correct params', async () => {
      mockRpc.mockResolvedValue({ error: null })

      const { recordLeaderboardCompletion } = await import('../leaderboard.service')
      await recordLeaderboardCompletion({
        eventId: 'evt-123',
        gameType: 'kana',
        inputMode: 'tap',
        scoreDelta: 3,
      })

      expect(mockRpc).toHaveBeenCalledWith('record_leaderboard_completion', {
        p_event_id: 'evt-123',
        p_game_type: 'kana',
        p_input_mode: 'tap',
        p_score_delta: 3,
      })
    })

    it('returns ok true on success', async () => {
      mockRpc.mockResolvedValue({ error: null })

      const { recordLeaderboardCompletion } = await import('../leaderboard.service')
      const result = await recordLeaderboardCompletion({
        eventId: 'evt-456',
        gameType: 'kotoba',
        inputMode: 'type',
        scoreDelta: 1,
      })

      expect(result).toEqual({ ok: true, data: undefined })
    })

    it('returns error on RPC failure', async () => {
      mockRpc.mockResolvedValue({ error: { message: 'Rate limit exceeded' } })

      const { recordLeaderboardCompletion } = await import('../leaderboard.service')
      const result = await recordLeaderboardCompletion({
        eventId: 'evt-789',
        gameType: 'kana',
        inputMode: 'swipe',
        scoreDelta: 5,
      })

      expect(result).toEqual({ ok: false, error: 'Rate limit exceeded' })
    })
  })

  describe('loadLeaderboard', () => {
    it('calls get_leaderboard RPC with correct params', async () => {
      mockRpc.mockResolvedValue({ data: [], error: null })

      const { loadLeaderboard } = await import('../leaderboard.service')
      await loadLeaderboard('kana', 'tap', 'all-time')

      expect(mockRpc).toHaveBeenCalledWith('get_leaderboard', {
        p_game_type: 'kana',
        p_input_mode: 'tap',
        p_period: 'all-time',
        p_limit: 50,
      })
    })

    it('transforms RPC response to LeaderboardBoard shape', async () => {
      mockRpc.mockResolvedValue({
        data: [
          { rank: 1, username: 'alpha', score: 500, is_current_user: false },
          { rank: 2, username: 'beta', score: 300, is_current_user: true },
          { rank: 3, username: 'gamma', score: 200, is_current_user: false },
        ],
        error: null,
      })

      const { loadLeaderboard } = await import('../leaderboard.service')
      const result = await loadLeaderboard('kana', 'type', 'all-time')

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data.entries).toHaveLength(3)
        expect(result.data.entries[0]).toEqual({
          rank: 1,
          username: 'alpha',
          score: 500,
          isCurrentUser: false,
        })
        expect(result.data.entries[1]).toEqual({
          rank: 2,
          username: 'beta',
          score: 300,
          isCurrentUser: true,
        })
        expect(result.data.currentUserPinned).toBeNull()
      }
    })

    it('separates pinned user row when rank exceeds 50', async () => {
      mockRpc.mockResolvedValue({
        data: [
          { rank: 1, username: 'top', score: 999, is_current_user: false },
          { rank: 73, username: 'me', score: 10, is_current_user: true },
        ],
        error: null,
      })

      const { loadLeaderboard } = await import('../leaderboard.service')
      const result = await loadLeaderboard('kotoba', 'swipe', 'this-week')

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data.entries).toHaveLength(1)
        expect(result.data.entries[0].username).toBe('top')
        expect(result.data.currentUserPinned).toEqual({
          rank: 73,
          username: 'me',
          score: 10,
          isCurrentUser: true,
        })
      }
    })

    it('returns null pinned row when user is in top 50', async () => {
      mockRpc.mockResolvedValue({
        data: [
          { rank: 5, username: 'me', score: 400, is_current_user: true },
          { rank: 6, username: 'other', score: 350, is_current_user: false },
        ],
        error: null,
      })

      const { loadLeaderboard } = await import('../leaderboard.service')
      const result = await loadLeaderboard('kana', 'tap', 'all-time')

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data.currentUserPinned).toBeNull()
        expect(result.data.entries).toHaveLength(2)
      }
    })

    it('returns empty board on empty RPC response', async () => {
      mockRpc.mockResolvedValue({ data: [], error: null })

      const { loadLeaderboard } = await import('../leaderboard.service')
      const result = await loadLeaderboard('kana', 'tap', 'this-week')

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data.entries).toHaveLength(0)
        expect(result.data.currentUserPinned).toBeNull()
      }
    })

    it('returns empty board when data is null', async () => {
      mockRpc.mockResolvedValue({ data: null, error: null })

      const { loadLeaderboard } = await import('../leaderboard.service')
      const result = await loadLeaderboard('kana', 'tap', 'all-time')

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data.entries).toHaveLength(0)
        expect(result.data.currentUserPinned).toBeNull()
      }
    })

    it('returns error on RPC failure', async () => {
      mockRpc.mockResolvedValue({ error: { message: 'Connection failed' } })

      const { loadLeaderboard } = await import('../leaderboard.service')
      const result = await loadLeaderboard('kana', 'type', 'all-time')

      expect(result).toEqual({ ok: false, error: 'Connection failed' })
    })
  })
})
