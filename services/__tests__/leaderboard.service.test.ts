// ------------------------------------------------------------
// File: services/__tests__/leaderboard.service.test.ts
// Purpose: Unit tests for leaderboard service. Validates session
//          RPCs, response transformation, pinned user separation,
//          and error handling.
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

  describe('startLeaderboardSession', () => {
    it('calls RPC with correct params for kana', async () => {
      mockRpc.mockResolvedValue({ data: 'session-1', error: null })

      const { startLeaderboardSession } = await import('../leaderboard.service')
      await startLeaderboardSession({
        gameType: 'kana',
        inputMode: 'tap',
        wordId: '1198180',
        kotobaInput: null,
      })

      expect(mockRpc).toHaveBeenCalledWith('start_leaderboard_session', {
        p_game_type: 'kana',
        p_input_mode: 'tap',
        p_word_id: '1198180',
        p_kotoba_input: null,
      })
    })

    it('calls RPC with correct params for kotoba kanji', async () => {
      mockRpc.mockResolvedValue({ data: 'session-2', error: null })

      const { startLeaderboardSession } = await import('../leaderboard.service')
      await startLeaderboardSession({
        gameType: 'kotoba',
        inputMode: 'type',
        wordId: '1198180',
        kotobaInput: 'kanji',
      })

      expect(mockRpc).toHaveBeenCalledWith('start_leaderboard_session', {
        p_game_type: 'kotoba',
        p_input_mode: 'type',
        p_word_id: '1198180',
        p_kotoba_input: 'kanji',
      })
    })

    it('returns session ID on success', async () => {
      mockRpc.mockResolvedValue({ data: 'session-abc', error: null })

      const { startLeaderboardSession } = await import('../leaderboard.service')
      const result = await startLeaderboardSession({
        gameType: 'kana',
        inputMode: 'tap',
        wordId: '1198180',
        kotobaInput: null,
      })

      expect(result).toEqual({ ok: true, data: 'session-abc' })
    })

    it('returns null for hidden users', async () => {
      mockRpc.mockResolvedValue({ data: null, error: null })

      const { startLeaderboardSession } = await import('../leaderboard.service')
      const result = await startLeaderboardSession({
        gameType: 'kana',
        inputMode: 'tap',
        wordId: '1198180',
        kotobaInput: null,
      })

      expect(result).toEqual({ ok: true, data: null })
    })

    it('returns error on failure', async () => {
      mockRpc.mockResolvedValue({ error: { message: 'Rate limit exceeded' } })

      const { startLeaderboardSession } = await import('../leaderboard.service')
      const result = await startLeaderboardSession({
        gameType: 'kana',
        inputMode: 'tap',
        wordId: '1198180',
        kotobaInput: null,
      })

      expect(result).toEqual({ ok: false, error: 'Rate limit exceeded' })
    })
  })

  describe('finalizeLeaderboardSession', () => {
    it('calls RPC with session ID and attempts', async () => {
      mockRpc.mockResolvedValue({ error: null })

      const { finalizeLeaderboardSession } = await import('../leaderboard.service')
      await finalizeLeaderboardSession({
        sessionId: 'session-1',
        attempts: [
          { charIndex: 0, submitted: 'a' },
          { charIndex: 1, submitted: 'u' },
        ],
      })

      expect(mockRpc).toHaveBeenCalledWith('finalize_leaderboard_session', {
        p_session_id: 'session-1',
        p_attempts: [
          { charIndex: 0, submitted: 'a' },
          { charIndex: 1, submitted: 'u' },
        ],
      })
    })

    it('returns error on failure', async () => {
      mockRpc.mockResolvedValue({ error: { message: 'Session expired' } })

      const { finalizeLeaderboardSession } = await import('../leaderboard.service')
      const result = await finalizeLeaderboardSession({
        sessionId: 'session-1',
        attempts: [{ charIndex: 0, submitted: 'a' }],
      })

      expect(result).toEqual({ ok: false, error: 'Session expired' })
    })
  })

  describe('old RPC removal', () => {
    it('does not export recordLeaderboardCompletion', async () => {
      const service = await import('../leaderboard.service')
      expect('recordLeaderboardCompletion' in service).toBe(false)
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
