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
  createAnonClient,
} from './setup'

describe('Bug report integration', () => {
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
})
