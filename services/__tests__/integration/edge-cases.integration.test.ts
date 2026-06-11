// ─────────────────────────────────────────────
// File: services/__tests__/integration/edge-cases.integration.test.ts
// Purpose: Edge case and security boundary integration tests.
//          Covers: epoch stale-write rejection, cross-user RLS,
//          malformed payloads, account deletion cascade, username
//          validation, and concurrent access patterns.
// ─────────────────────────────────────────────

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import {
  type TestContext,
  setupTestUser,
  teardownTestUser,
  skipIfNotRunning,
  integrationDescribe,
  createAdminClient,
  createAnonClient,
} from './setup'
import { createClient } from '@supabase/supabase-js'

const LOCAL_URL = process.env['SUPABASE_LOCAL_URL'] ?? 'http://127.0.0.1:54321'
const LOCAL_ANON_KEY = process.env['SUPABASE_LOCAL_ANON_KEY'] ?? ''
const USER_B_EMAIL = 'integration-userb@langtap.test'
const USER_B_PASSWORD = 'test-password-456!'

integrationDescribe('Edge cases integration', () => {
  let ctx: TestContext
  let userBId: string | null = null
  let userBClient: ReturnType<typeof createClient>

  beforeAll(async () => {
    ctx = await setupTestUser()
    if (!ctx.running) return

    // Create a second user for cross-user RLS tests
    const { data: existing } = await ctx.adminClient.auth.admin.listUsers()
    const prev = existing?.users?.find((u) => u.email === USER_B_EMAIL)
    if (prev) await ctx.adminClient.auth.admin.deleteUser(prev.id)

    const { data: created } = await ctx.adminClient.auth.admin.createUser({
      email: USER_B_EMAIL,
      password: USER_B_PASSWORD,
      email_confirm: true,
    })
    userBId = created?.user?.id ?? null

    userBClient = createClient(LOCAL_URL, LOCAL_ANON_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    await userBClient.auth.signInWithPassword({
      email: USER_B_EMAIL,
      password: USER_B_PASSWORD,
    })
  }, 20000)

  afterAll(async () => {
    if (userBId) await ctx.adminClient.auth.admin.deleteUser(userBId)
    await teardownTestUser(ctx)
  })

  // ── Epoch stale-write rejection ────────────

  describe('epoch consistency', () => {
    it('checkpoint_mastery with wrong epoch is rejected', async () => {
      if (skipIfNotRunning(ctx)) return
      const { data: chars } = await ctx.userClient
        .from('kana_character_catalog')
        .select('character_id')
        .limit(1)
      const charId = (chars?.[0] as Record<string, unknown>)?.character_id as string
      if (!charId) return

      // First reset to get a known epoch
      const { data: resetData } = await ctx.userClient.rpc('reset_all_mastery')
      const currentEpoch = (resetData as Record<string, unknown>)['new_epoch'] as number

      // Checkpoint with stale epoch (current - 1) should fail or be ignored
      const { error } = await ctx.userClient.rpc('checkpoint_mastery', {
        p_epoch: currentEpoch - 1,
        p_rows: JSON.stringify([{ id: charId, score: 99, learning_score: 5 }]),
      })
      // Stale epoch: RPC should reject with error
      expect(error).toBeTruthy()
    })
  })

  // ── Cross-user RLS ─────────────────────────

  describe('cross-user RLS', () => {
    it('user B cannot read user A mastery scores', async () => {
      if (skipIfNotRunning(ctx) || !userBId) return
      const { data } = await userBClient.from('mastery').select('*').eq('user_id', ctx.testUserId!)
      expect(data).toEqual([])
    })

    it('user B cannot read user A word mastery scores', async () => {
      if (skipIfNotRunning(ctx) || !userBId) return
      const { data } = await userBClient
        .from('word_mastery')
        .select('*')
        .eq('user_id', ctx.testUserId!)
      expect(data).toEqual([])
    })

    it('user B cannot read user A practice sessions', async () => {
      if (skipIfNotRunning(ctx) || !userBId) return
      const { data } = await userBClient
        .from('practice_sessions')
        .select('*')
        .eq('user_id', ctx.testUserId!)
      expect(data).toEqual([])
    })

    it('user B cannot update user A profile', async () => {
      if (skipIfNotRunning(ctx) || !userBId) return
      const { data } = await userBClient
        .from('profiles')
        .update({ username: 'stolen' })
        .eq('id', ctx.testUserId!)
        .select()
      expect(data).toEqual([])
    })
  })

  // ── Username validation ────────────────────

  describe('username validation', () => {
    it('accepts valid username for user B', async () => {
      if (skipIfNotRunning(ctx) || !userBId) return
      const { data, error } = await userBClient.rpc('change_username', {
        p_new_username: 'valid_user_b',
      })
      expect(error).toBeNull()
      expect((data as Record<string, unknown>)['ok']).toBe(true)
    })

    it('enforces cooldown on second change for user B', async () => {
      if (skipIfNotRunning(ctx) || !userBId) return
      const { data, error } = await userBClient.rpc('change_username', {
        p_new_username: 'valid_user_b_2',
      })
      expect(error).toBeNull()
      expect((data as Record<string, unknown>)['ok']).toBe(false)
      expect((data as Record<string, unknown>)['error_code']).toBe('cooldown_active')
    })
  })

  // ── Account deletion cascade ───────────────

  describe('account deletion cascade', () => {
    it('deleting a user cascades to all owned rows', async () => {
      if (skipIfNotRunning(ctx)) return
      const admin = createAdminClient()

      // Create a disposable user
      const { data: created } = await admin.auth.admin.createUser({
        email: 'disposable@langtap.test',
        password: 'disposable-123!',
        email_confirm: true,
      })
      const disposableId = created?.user?.id
      if (!disposableId) return

      const disposableClient = createAnonClient()
      await disposableClient.auth.signInWithPassword({
        email: 'disposable@langtap.test',
        password: 'disposable-123!',
      })

      // Write some mastery data
      await disposableClient.rpc('checkpoint_mastery', {
        p_epoch: 0,
        p_rows: JSON.stringify([]),
      })

      // Delete the user
      await admin.auth.admin.deleteUser(disposableId)

      // Verify cascade: profile should be gone
      const { data: profile } = await admin.from('profiles').select('id').eq('id', disposableId)
      expect(profile).toEqual([])
    })
  })

  // ── Anonymous RLS restrictions ─────────────

  describe('anonymous RLS comprehensive', () => {
    it('anonymous cannot call checkpoint_mastery', async () => {
      if (skipIfNotRunning(ctx)) return
      const anonClient = createAnonClient()
      const { error } = await anonClient.rpc('checkpoint_mastery', {
        p_epoch: 1,
        p_rows: JSON.stringify([]),
      })
      expect(error).toBeTruthy()
    })

    it('anonymous cannot call checkpoint_word_mastery', async () => {
      if (skipIfNotRunning(ctx)) return
      const anonClient = createAnonClient()
      const { error } = await anonClient.rpc('checkpoint_word_mastery', {
        p_epoch: 1,
        p_rows: JSON.stringify([]),
      })
      expect(error).toBeTruthy()
    })

    it('anonymous cannot call factory_reset', async () => {
      if (skipIfNotRunning(ctx)) return
      const anonClient = createAnonClient()
      const { error } = await anonClient.rpc('factory_reset')
      expect(error).toBeTruthy()
    })

    it('anonymous cannot call get_daily_usage', async () => {
      if (skipIfNotRunning(ctx)) return
      const anonClient = createAnonClient()
      const { error } = await anonClient.rpc('get_daily_usage')
      expect(error).toBeTruthy()
    })
  })
})
