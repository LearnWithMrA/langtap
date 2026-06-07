// ─────────────────────────────────────────────
// File: services/__tests__/integration/kana.integration.test.ts
// Purpose: Integration tests for kana mastery, sync, unlocks,
//          and reset against local Supabase Docker.
// ─────────────────────────────────────────────

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import {
  type TestContext,
  setupTestUser,
  teardownTestUser,
  skipIfNotRunning,
  createAnonClient,
} from './setup'

describe('Kana integration', () => {
  let ctx: TestContext

  beforeAll(async () => {
    ctx = await setupTestUser()
  }, 15000)

  afterAll(async () => {
    await teardownTestUser(ctx)
  })

  describe('mastery sync', () => {
    it('checkpoint_mastery accepts valid scores', async () => {
      if (skipIfNotRunning(ctx)) return
      const { data: chars } = await ctx.userClient
        .from('kana_character_catalog')
        .select('character_id')
        .limit(2)
      const ids = chars?.map((c: Record<string, unknown>) => c.character_id) ?? []
      if (ids.length === 0) return

      // Get current epoch from snapshot
      const { data: snapshot } = await ctx.userClient.rpc('load_mastery_snapshot')
      const epoch = ((snapshot as Record<string, unknown>)?.['epoch'] as number) ?? 0

      const { error } = await ctx.userClient.rpc('checkpoint_mastery', {
        p_epoch: epoch,
        p_rows: ids.map((id: string) => ({ id, score: 5, learning_score: 5 })),
      })
      expect(error).toBeNull()
    })

    it('load_mastery_snapshot returns synced data', async () => {
      if (skipIfNotRunning(ctx)) return
      const { data, error } = await ctx.userClient.rpc('load_mastery_snapshot')
      expect(error).toBeNull()
      expect(data).toBeTruthy()
      const d = data as Record<string, unknown>
      expect(typeof d['epoch']).toBe('number')
      expect(d['scores']).toBeTruthy()
    })

    it('checkpoint_manual_unlocks persists character unlocks', async () => {
      if (skipIfNotRunning(ctx)) return
      const { error } = await ctx.userClient.rpc('checkpoint_manual_unlocks', {
        p_epoch: 1,
        p_ids: ['h_a', 'h_i', 'h_u'],
      })
      expect(error).toBeNull()
    })
  })

  describe('reset', () => {
    it('reset_all_mastery returns new epoch', async () => {
      if (skipIfNotRunning(ctx)) return
      const { data, error } = await ctx.userClient.rpc('reset_all_mastery')
      expect(error).toBeNull()
      expect(data).toBeTruthy()
      expect(typeof (data as Record<string, unknown>)['new_epoch']).toBe('number')
    })

    it('reset_all_mastery increments epoch each time', async () => {
      if (skipIfNotRunning(ctx)) return
      const { data: first } = await ctx.userClient.rpc('reset_all_mastery')
      const epoch1 = (first as Record<string, unknown>)['new_epoch'] as number
      const { data: second } = await ctx.userClient.rpc('reset_all_mastery')
      const epoch2 = (second as Record<string, unknown>)['new_epoch'] as number
      expect(epoch2).toBeGreaterThan(epoch1)
    })
  })

  describe('RLS', () => {
    it('anonymous cannot write to mastery table', async () => {
      if (skipIfNotRunning(ctx)) return
      const anonClient = createAnonClient()
      const { error } = await anonClient
        .from('mastery')
        .insert({ user_id: ctx.testUserId, character_id: 'test', score: 1 })
      expect(error).toBeTruthy()
    })

    it('anonymous cannot call reset_all_mastery', async () => {
      if (skipIfNotRunning(ctx)) return
      const anonClient = createAnonClient()
      const { error } = await anonClient.rpc('reset_all_mastery')
      expect(error).toBeTruthy()
    })
  })

  describe('catalogs', () => {
    it('kana_character_catalog has 234 characters', async () => {
      if (skipIfNotRunning(ctx)) return
      const { data, error } = await ctx.userClient
        .from('kana_character_catalog')
        .select('character_id')
      expect(error).toBeNull()
      expect(data).toBeTruthy()
      expect(data!.length).toBe(234)
    })
  })
})
