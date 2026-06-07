// ─────────────────────────────────────────────
// File: services/__tests__/integration/home.integration.test.ts
// Purpose: Integration tests for home/dashboard features: daily
//          cap, leaderboard, practice sessions, and streak data
//          against local Supabase Docker.
// ─────────────────────────────────────────────

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { type TestContext, setupTestUser, teardownTestUser, skipIfNotRunning } from './setup'

describe('Home integration', () => {
  let ctx: TestContext

  beforeAll(async () => {
    ctx = await setupTestUser()
  }, 15000)

  afterAll(async () => {
    await teardownTestUser(ctx)
  })

  describe('daily cap', () => {
    it('get_daily_usage returns valid response', async () => {
      if (skipIfNotRunning(ctx)) return
      const { data, error } = await ctx.userClient.rpc('get_daily_usage')
      expect(error).toBeNull()
      expect(data).toBeTruthy()
      const d = data as Record<string, unknown>
      expect(typeof d['total_today']).toBe('number')
      expect(typeof d['is_capped']).toBe('boolean')
      expect(typeof d['cap_amount']).toBe('number')
      expect(typeof d['cap_enabled']).toBe('boolean')
    })

    it('increment_daily_distance succeeds without error', async () => {
      if (skipIfNotRunning(ctx)) return
      const { data, error } = await ctx.userClient.rpc('increment_daily_distance', {
        p_metres: 5,
        p_completion_id: crypto.randomUUID(),
      })
      expect(error).toBeNull()
      expect(data).toBeTruthy()
      expect(typeof (data as Record<string, unknown>)['total_today']).toBe('number')
    })

    it('increment_daily_distance deduplicates same completion_id', async () => {
      if (skipIfNotRunning(ctx)) return
      const completionId = crypto.randomUUID()
      const { data: first } = await ctx.userClient.rpc('increment_daily_distance', {
        p_metres: 3,
        p_completion_id: completionId,
      })
      const totalAfterFirst = (first as Record<string, unknown>)['total_today'] as number
      const { data: second } = await ctx.userClient.rpc('increment_daily_distance', {
        p_metres: 3,
        p_completion_id: completionId,
      })
      const totalAfterSecond = (second as Record<string, unknown>)['total_today'] as number
      expect(totalAfterSecond).toBe(totalAfterFirst)
    })
  })

  describe('leaderboard', () => {
    it('get_leaderboard returns results array', async () => {
      if (skipIfNotRunning(ctx)) return
      const { data, error } = await ctx.userClient.rpc('get_leaderboard', {
        p_game_type: 'kana',
        p_input_mode: 'tap',
        p_period: 'all_time',
        p_limit: 10,
      })
      expect(error).toBeNull()
      expect(Array.isArray(data)).toBe(true)
    })
  })

  describe('practice sessions', () => {
    it('record_practice_activity writes a session', async () => {
      if (skipIfNotRunning(ctx)) return
      const { error } = await ctx.userClient.rpc('record_practice_activity', {
        p_completion_id: crypto.randomUUID(),
        p_characters_count: 10,
      })
      expect(error).toBeNull()
    })
  })

  describe('factory reset', () => {
    it('factory_reset returns both new epochs', async () => {
      if (skipIfNotRunning(ctx)) return
      const { data, error } = await ctx.userClient.rpc('factory_reset')
      expect(error).toBeNull()
      expect(data).toBeTruthy()
      const d = data as Record<string, unknown>
      expect(typeof d['new_mastery_epoch']).toBe('number')
      expect(typeof d['new_word_mastery_epoch']).toBe('number')
    })
  })
})
