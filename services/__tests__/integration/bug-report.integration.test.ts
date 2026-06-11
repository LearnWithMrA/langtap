// ─────────────────────────────────────────────
// File: services/__tests__/integration/bug-report.integration.test.ts
// Purpose: Integration tests for bug report submission
//          against local Supabase Docker.
// ─────────────────────────────────────────────

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import {
  type TestContext,
  setupTestUser,
  teardownTestUser,
  skipIfNotRunning,
  integrationDescribe,
  createAnonClient,
} from './setup'

integrationDescribe('Bug report integration', () => {
  let ctx: TestContext

  beforeAll(async () => {
    ctx = await setupTestUser()
  }, 15000)

  afterAll(async () => {
    await teardownTestUser(ctx)
  })

  it('authenticated user cannot insert directly (writes via route handler only)', async () => {
    if (skipIfNotRunning(ctx)) return
    const { error } = await ctx.userClient.from('bug_reports').insert({
      user_id: ctx.testUserId,
      type: 'bug',
      description: 'Integration test bug report',
      app_state: { page: '/practice/kana', input_mode: 'tap' },
    })
    // No client-facing insert policy; writes go through route handler with service role
    expect(error).toBeTruthy()
  })

  it('admin (service role) can insert a bug report', async () => {
    if (skipIfNotRunning(ctx)) return
    const { error } = await ctx.adminClient.from('bug_reports').insert({
      user_id: ctx.testUserId,
      type: 'bug',
      description: 'Integration test bug report via admin',
      app_state: { page: '/practice/kana', input_mode: 'tap' },
    })
    expect(error).toBeNull()
  })

  it('anonymous user cannot insert a bug report', async () => {
    if (skipIfNotRunning(ctx)) return
    const anonClient = createAnonClient()
    const { error } = await anonClient.from('bug_reports').insert({
      user_id: ctx.testUserId,
      type: 'bug',
      description: 'Should not be allowed',
      app_state: {},
    })
    expect(error).toBeTruthy()
  })

  it('user cannot read bug reports (admin only)', async () => {
    if (skipIfNotRunning(ctx)) return
    const { data } = await ctx.userClient.from('bug_reports').select('id')
    expect(data).toEqual([])
  })

  describe('submit_bug_report RPC (atomic rate gate)', () => {
    it('is not callable by an authenticated client (service role only)', async () => {
      if (skipIfNotRunning(ctx)) return
      const { error } = await ctx.userClient.rpc('submit_bug_report', {
        p_user_id: ctx.testUserId,
        p_type: 'bug',
        p_description: 'Should be rejected',
        p_screenshot_path: null,
        p_user_agent: null,
        p_app_state: null,
      })
      expect(error).toBeTruthy()
    })

    it('inserts via service role, then rate-limits an immediate second report', async () => {
      if (skipIfNotRunning(ctx)) return
      // Clear earlier test inserts so the first RPC call is not already
      // inside the 60s window from the direct-insert test above.
      await ctx.adminClient.from('bug_reports').delete().eq('user_id', ctx.testUserId)

      const args = {
        p_user_id: ctx.testUserId,
        p_type: 'feature',
        p_description: 'Atomic RPC integration test',
        p_screenshot_path: null,
        p_user_agent: 'vitest',
        p_app_state: { page: '/practice/kana', input_mode: 'tap' },
      }
      const { data: first, error: firstError } = await ctx.adminClient.rpc(
        'submit_bug_report',
        args,
      )
      expect(firstError).toBeNull()
      expect((first as { ok: boolean }).ok).toBe(true)

      const { data: second, error: secondError } = await ctx.adminClient.rpc(
        'submit_bug_report',
        args,
      )
      expect(secondError).toBeNull()
      const result = second as { ok: boolean; error: string; retry_after: number }
      expect(result.ok).toBe(false)
      expect(result.error).toBe('rate_limited')
      expect(result.retry_after).toBeGreaterThan(0)
    })

    it('rejects an invalid report type', async () => {
      if (skipIfNotRunning(ctx)) return
      const { data, error } = await ctx.adminClient.rpc('submit_bug_report', {
        p_user_id: ctx.testUserId,
        p_type: 'spam',
        p_description: 'Invalid type test',
        p_screenshot_path: null,
        p_user_agent: null,
        p_app_state: null,
      })
      expect(error).toBeNull()
      const result = data as { ok: boolean; error: string }
      expect(result.ok).toBe(false)
      expect(result.error).toBe('invalid_type')
    })
  })
})
