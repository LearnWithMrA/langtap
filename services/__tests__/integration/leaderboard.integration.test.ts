// ─────────────────────────────────────────────
// File: services/__tests__/integration/leaderboard.integration.test.ts
// Purpose: Integration tests for leaderboard server-derived scoring,
//          session lifecycle, and ranking against local Supabase.
// ─────────────────────────────────────────────

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { type TestContext, setupTestUser, teardownTestUser, skipIfNotRunning } from './setup'

describe('Leaderboard integration', () => {
  let ctx: TestContext

  beforeAll(async () => {
    ctx = await setupTestUser()
  }, 15000)

  afterAll(async () => {
    await teardownTestUser(ctx)
  })

  describe('session lifecycle', () => {
    it('start_leaderboard_session returns a session_id', async () => {
      if (skipIfNotRunning(ctx)) return
      // Need a real word_id from the catalog
      const { data: words } = await ctx.userClient
        .from('leaderboard_word_catalog')
        .select('word_id')
        .limit(1)
      const wordId = words?.[0]?.word_id
      if (!wordId) return

      const { data, error } = await ctx.userClient.rpc('start_leaderboard_session', {
        p_game_type: 'kana',
        p_input_mode: 'tap',
        p_word_id: wordId,
        p_kotoba_input: null,
      })
      expect(error).toBeNull()
      expect(error).toBeNull()
      expect(data).toBeTruthy()
    })

    it('finalize_leaderboard_session accepts attempts', async () => {
      if (skipIfNotRunning(ctx)) return
      const { data: words } = await ctx.userClient
        .from('leaderboard_word_catalog')
        .select('word_id')
        .limit(1)
      const wordId = words?.[0]?.word_id
      if (!wordId) return

      // Start a session first
      const { data: startData } = await ctx.userClient.rpc('start_leaderboard_session', {
        p_game_type: 'kana',
        p_input_mode: 'tap',
        p_word_id: wordId,
        p_kotoba_input: null,
      })
      const sessionId = (startData as Record<string, unknown>)?.['session_id'] as string
      if (!sessionId) return

      const { error } = await ctx.userClient.rpc('finalize_leaderboard_session', {
        p_session_id: sessionId,
        p_attempts: JSON.stringify([
          { word_id: wordId, input: 'correct_input', correct: true, time_ms: 500 },
        ]),
      })
      expect(error).toBeNull()
    })
  })

  describe('ranking', () => {
    it('get_leaderboard returns array for all_time', async () => {
      if (skipIfNotRunning(ctx)) return
      const { data, error } = await ctx.userClient.rpc('get_leaderboard', {
        p_game_type: 'kana',
        p_input_mode: 'tap',
        p_period: 'all_time',
        p_limit: 50,
      })
      expect(error).toBeNull()
      expect(Array.isArray(data)).toBe(true)
    })

    it('get_leaderboard returns array for week period', async () => {
      if (skipIfNotRunning(ctx)) return
      const { data, error } = await ctx.userClient.rpc('get_leaderboard', {
        p_game_type: 'kana',
        p_input_mode: 'tap',
        p_period: 'week',
        p_limit: 50,
      })
      expect(error).toBeNull()
      expect(Array.isArray(data)).toBe(true)
    })

    it('get_leaderboard works for kotoba game type', async () => {
      if (skipIfNotRunning(ctx)) return
      const { data, error } = await ctx.userClient.rpc('get_leaderboard', {
        p_game_type: 'kotoba',
        p_input_mode: 'type',
        p_period: 'all_time',
        p_limit: 50,
      })
      expect(error).toBeNull()
      expect(Array.isArray(data)).toBe(true)
    })
  })
})
