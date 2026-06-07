// ─────────────────────────────────────────────
// File: services/__tests__/integration/kotoba.integration.test.ts
// Purpose: Integration tests for word mastery, sync, and reset
//          against local Supabase Docker.
// ─────────────────────────────────────────────

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import {
  type TestContext,
  setupTestUser,
  teardownTestUser,
  skipIfNotRunning,
  createAnonClient,
} from './setup'

describe('Kotoba integration', () => {
  let ctx: TestContext

  beforeAll(async () => {
    ctx = await setupTestUser()
  }, 15000)

  afterAll(async () => {
    await teardownTestUser(ctx)
  })

  describe('word mastery sync', () => {
    it('checkpoint_word_mastery accepts valid scores', async () => {
      if (skipIfNotRunning(ctx)) return
      // Get a real word ID from the leaderboard word catalog
      const { data: words } = await ctx.userClient
        .from('leaderboard_word_catalog')
        .select('word_id')
        .limit(1)
      const wordId = words?.[0]?.word_id
      if (!wordId) {
        console.warn('No words in leaderboard_word_catalog, skipping')
        return
      }
      const { data: snapshot } = await ctx.userClient.rpc('load_word_mastery_snapshot')
      const epoch = ((snapshot as Record<string, unknown>)?.['epoch'] as number) ?? 0
      const { error } = await ctx.userClient.rpc('checkpoint_word_mastery', {
        p_epoch: epoch,
        p_rows: [{ word_id: wordId, score: 5 }],
      })
      expect(error).toBeNull()
    })

    it('load_word_mastery_snapshot returns synced data', async () => {
      if (skipIfNotRunning(ctx)) return
      const { data, error } = await ctx.userClient.rpc('load_word_mastery_snapshot')
      expect(error).toBeNull()
      expect(data).toBeTruthy()
      const d = data as Record<string, unknown>
      expect(typeof d['epoch']).toBe('number')
    })

    it('checkpoint_word_manual_unlocks persists word unlocks', async () => {
      if (skipIfNotRunning(ctx)) return
      const { data: words } = await ctx
        .userClient!.from('leaderboard_word_catalog')
        .select('word_id')
        .limit(2)
      const ids = words?.map((w: Record<string, unknown>) => w.word_id as string) ?? []
      if (ids.length < 2) return
      const { data: snap } = await ctx.userClient!.rpc('load_word_mastery_snapshot')
      const epoch = ((snap as Record<string, unknown>)?.['epoch'] as number) ?? 0
      const { error } = await ctx.userClient.rpc('checkpoint_word_manual_unlocks', {
        p_epoch: epoch,
        p_ids: ids,
      })
      expect(error).toBeNull()
    })

    it('checkpoint_word_mastery round-trip: scores persist on reload', async () => {
      if (skipIfNotRunning(ctx)) return
      const { data: words } = await ctx
        .userClient!.from('leaderboard_word_catalog')
        .select('word_id')
        .limit(1)
      const wordId = (words?.[0] as Record<string, unknown>)?.word_id as string
      if (!wordId) return

      const { data: snapshot } = await ctx.userClient!.rpc('load_word_mastery_snapshot')
      const epoch = ((snapshot as Record<string, unknown>)?.['epoch'] as number) ?? 0

      await ctx.userClient!.rpc('checkpoint_word_mastery', {
        p_epoch: epoch,
        p_rows: [{ word_id: wordId, score: 25 }],
      })

      const { data: reloaded } = await ctx.userClient!.rpc('load_word_mastery_snapshot')
      const scores = (reloaded as Record<string, unknown>)?.['scores'] as Record<string, unknown>[]
      const found = scores?.find((s) => s['word_id'] === wordId)
      expect(found).toBeTruthy()
      expect(found?.['score']).toBe(25)
    })

    it('checkpoint_word_manual_unlocks round-trip: unlocks persist on reload', async () => {
      if (skipIfNotRunning(ctx)) return
      const { data: words } = await ctx
        .userClient!.from('leaderboard_word_catalog')
        .select('word_id')
        .limit(1)
      const wordId = (words?.[0] as Record<string, unknown>)?.word_id as string
      if (!wordId) return
      const { data: snap } = await ctx.userClient!.rpc('load_word_mastery_snapshot')
      const epoch = ((snap as Record<string, unknown>)?.['epoch'] as number) ?? 0
      await ctx.userClient!.rpc('checkpoint_word_manual_unlocks', {
        p_epoch: epoch,
        p_ids: [wordId],
      })

      const { data: reloaded } = await ctx.userClient!.rpc('load_word_mastery_snapshot')
      const unlockIds = (reloaded as Record<string, unknown>)?.['unlocks'] as string[]
      expect(unlockIds).toContain(wordId)
    })
  })

  describe('single word reset', () => {
    it('reset_word_mastery zeros score and preserves others', async () => {
      if (skipIfNotRunning(ctx)) return

      const { data: words } = await ctx
        .userClient!.from('leaderboard_word_catalog')
        .select('word_id')
        .limit(2)
      const wordIds = words?.map((w: Record<string, unknown>) => w.word_id as string) ?? []
      if (wordIds.length < 2) return

      const { data: snap } = await ctx.userClient!.rpc('load_word_mastery_snapshot')
      const epoch = ((snap as Record<string, unknown>)?.['epoch'] as number) ?? 0

      await ctx.userClient!.rpc('checkpoint_word_mastery', {
        p_epoch: epoch,
        p_rows: [
          { word_id: wordIds[0], score: 25 },
          { word_id: wordIds[1], score: 12 },
        ],
      })

      const { error } = await ctx.userClient!.rpc('reset_word_mastery', {
        p_word_id: wordIds[0],
      })
      expect(error).toBeNull()

      const { data: reloaded } = await ctx.userClient!.rpc('load_word_mastery_snapshot')
      const scores = (reloaded as Record<string, unknown>)?.['scores'] as Array<
        Record<string, unknown>
      >

      const w0 = scores?.find((s) => s['word_id'] === wordIds[0])
      const w1 = scores?.find((s) => s['word_id'] === wordIds[1])

      if (w0) {
        expect(w0['score']).toBe(0)
      }
      expect(w1).toBeTruthy()
      expect(w1?.['score']).toBe(12)
    })
  })

  describe('reset all', () => {
    it('reset_all_word_mastery clears all scores on reload', async () => {
      if (skipIfNotRunning(ctx)) return

      const { data, error } = await ctx.userClient!.rpc('reset_all_word_mastery')
      expect(error).toBeNull()
      const newEpoch = (data as Record<string, unknown>)['new_epoch'] as number

      const { data: reloaded } = await ctx.userClient!.rpc('load_word_mastery_snapshot')
      const snapshot = reloaded as Record<string, unknown>
      expect(snapshot['epoch']).toBe(newEpoch)
      const scores = (snapshot['scores'] as Array<Record<string, unknown>>) ?? []
      for (const row of scores) {
        expect(row['score']).toBe(0)
      }
      expect((snapshot['unlocks'] as unknown[])?.length ?? 0).toBe(0)
    })
  })

  describe('reset', () => {
    it('reset_all_word_mastery returns new epoch', async () => {
      if (skipIfNotRunning(ctx)) return
      const { data, error } = await ctx.userClient.rpc('reset_all_word_mastery')
      expect(error).toBeNull()
      expect(data).toBeTruthy()
      expect(typeof (data as Record<string, unknown>)['new_epoch']).toBe('number')
    })
  })

  describe('RLS', () => {
    it('anonymous cannot write to word_mastery table', async () => {
      if (skipIfNotRunning(ctx)) return
      const anonClient = createAnonClient()
      const { error } = await anonClient
        .from('word_mastery')
        .insert({ user_id: ctx.testUserId, word_id: 'test', score: 1 })
      expect(error).toBeTruthy()
    })
  })

  describe('catalogs', () => {
    it('leaderboard_word_catalog has entries', async () => {
      if (skipIfNotRunning(ctx)) return
      const { data, error } = await ctx.userClient
        .from('leaderboard_word_catalog')
        .select('word_id')
        .limit(5)
      expect(error).toBeNull()
      expect(data).toBeTruthy()
      expect(data!.length).toBeGreaterThan(0)
    })
  })
})
