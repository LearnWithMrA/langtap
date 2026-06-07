// ─────────────────────────────────────────────
// File: services/__tests__/integration/streak.integration.test.ts
// Purpose: Integration tests for practice activity recording and
//          streak/heatmap data retrieval against local Supabase.
// ─────────────────────────────────────────────

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { type TestContext, setupTestUser, teardownTestUser, skipIfNotRunning } from './setup'

describe('Streak integration', () => {
  let ctx: TestContext

  beforeAll(async () => {
    ctx = await setupTestUser()
  }, 15000)

  afterAll(async () => {
    await teardownTestUser(ctx)
  })

  describe('practice activity', () => {
    it('record_practice_activity succeeds', async () => {
      if (skipIfNotRunning(ctx)) return
      const { data, error } = await ctx.userClient.rpc('record_practice_activity', {
        p_completion_id: crypto.randomUUID(),
        p_characters_count: 15,
      })
      expect(error).toBeNull()
      expect(data).toBeTruthy()
      const d = data as Record<string, unknown>
      expect(d['inserted']).toBe(true)
      expect(typeof d['local_date']).toBe('string')
      expect(typeof d['characters_practiced']).toBe('number')
    })

    it('record_practice_activity deduplicates same completion_id', async () => {
      if (skipIfNotRunning(ctx)) return
      const completionId = crypto.randomUUID()
      await ctx.userClient.rpc('record_practice_activity', {
        p_completion_id: completionId,
        p_characters_count: 10,
      })
      const { data } = await ctx.userClient.rpc('record_practice_activity', {
        p_completion_id: completionId,
        p_characters_count: 10,
      })
      const d = data as Record<string, unknown>
      expect(d['inserted']).toBe(false)
    })

    it('record_practice_activity accumulates characters across calls', async () => {
      if (skipIfNotRunning(ctx)) return
      await ctx.userClient.rpc('record_practice_activity', {
        p_completion_id: crypto.randomUUID(),
        p_characters_count: 5,
      })
      const { data } = await ctx.userClient.rpc('record_practice_activity', {
        p_completion_id: crypto.randomUUID(),
        p_characters_count: 7,
      })
      const d = data as Record<string, unknown>
      expect(d['characters_practiced'] as number).toBeGreaterThanOrEqual(12)
    })
  })

  describe('practice session persistence', () => {
    it('practice_sessions row persists with correct data after record', async () => {
      if (skipIfNotRunning(ctx)) return

      // Record activity
      const { data: result } = await ctx.userClient!.rpc('record_practice_activity', {
        p_completion_id: crypto.randomUUID(),
        p_characters_count: 25,
      })
      const localDate = (result as Record<string, unknown>)['local_date'] as string

      // Read practice_sessions directly (simulating refresh/reload)
      const { data: sessions, error } = await ctx
        .userClient!.from('practice_sessions')
        .select('local_date, characters_practiced')
        .eq('user_id', ctx.testUserId!)
        .eq('local_date', localDate)
      expect(error).toBeNull()
      expect(sessions).toBeTruthy()
      expect(sessions!.length).toBeGreaterThanOrEqual(1)
      const session = sessions![0] as Record<string, unknown>
      expect((session['characters_practiced'] as number) ?? 0).toBeGreaterThanOrEqual(25)
    })

    it('practice_activity_events are accessible via admin', async () => {
      if (skipIfNotRunning(ctx)) return
      // practice_activity_events has no client SELECT policy (RPC-only access),
      // so we verify via the admin client
      const { data, error } = await ctx
        .adminClient!.from('practice_activity_events')
        .select('*')
        .eq('user_id', ctx.testUserId!)
        .limit(5)
      expect(error).toBeNull()
      expect(data).toBeTruthy()
      expect(data!.length).toBeGreaterThan(0)
    })
  })
})
