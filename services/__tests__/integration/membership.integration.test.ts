// ─────────────────────────────────────────────
// File: services/__tests__/integration/membership.integration.test.ts
// Purpose: Integration tests for the membership schema - guard trigger
//          blocks client self-upgrades, server bypass works, and the
//          is_active_member function is service-role only.
// ─────────────────────────────────────────────

import { it, expect, beforeAll, afterAll } from 'vitest'
import {
  type TestContext,
  setupTestUser,
  teardownTestUser,
  skipIfNotRunning,
  integrationDescribe,
} from './setup'

integrationDescribe('Membership integration', () => {
  let ctx: TestContext

  beforeAll(async () => {
    ctx = await setupTestUser()
  }, 15000)

  afterAll(async () => {
    await teardownTestUser(ctx)
  })

  it('new profiles default to the free tier', async () => {
    if (skipIfNotRunning(ctx)) return
    const { data, error } = await ctx.userClient
      .from('profiles')
      .select('membership_tier, membership_expires_at')
      .eq('id', ctx.testUserId)
      .single()
    expect(error).toBeNull()
    expect(data?.membership_tier).toBe('free')
    expect(data?.membership_expires_at).toBeNull()
  })

  it('a user cannot upgrade their own membership tier', async () => {
    if (skipIfNotRunning(ctx)) return
    const { error } = await ctx.userClient
      .from('profiles')
      .update({ membership_tier: 'lifetime' })
      .eq('id', ctx.testUserId)
    expect(error).toBeTruthy()
    expect(error?.message).toContain('server-side only')
  })

  it('a user cannot set their own stripe_customer_id', async () => {
    if (skipIfNotRunning(ctx)) return
    const { error } = await ctx.userClient
      .from('profiles')
      .update({ stripe_customer_id: 'cus_fake' })
      .eq('id', ctx.testUserId)
    expect(error).toBeTruthy()
  })

  it('normal profile updates still work with membership columns untouched', async () => {
    if (skipIfNotRunning(ctx)) return
    const { error } = await ctx.userClient
      .from('profiles')
      .update({ hints_enabled: false })
      .eq('id', ctx.testUserId)
    expect(error).toBeNull()
  })

  it('even service role cannot update membership without the bypass', async () => {
    if (skipIfNotRunning(ctx)) return
    const { error: noBypassError } = await ctx.adminClient
      .from('profiles')
      .update({ membership_tier: 'lifetime' })
      .eq('id', ctx.testUserId)
    expect(noBypassError).toBeTruthy()
    expect(noBypassError?.message).toContain('server-side only')
  })

  it('admin_set_membership assigns lifetime (owner flow) and is_active_member reflects it', async () => {
    if (skipIfNotRunning(ctx)) return
    const { data, error } = await ctx.adminClient.rpc('admin_set_membership', {
      p_user_id: ctx.testUserId,
      p_tier: 'lifetime',
    })
    expect(error).toBeNull()
    expect((data as { ok: boolean }).ok).toBe(true)

    const { data: profile } = await ctx.userClient
      .from('profiles')
      .select('membership_tier')
      .eq('id', ctx.testUserId)
      .single()
    expect(profile?.membership_tier).toBe('lifetime')

    const { data: active } = await ctx.adminClient.rpc('is_active_member', {
      p_user_id: ctx.testUserId,
    })
    expect(active).toBe(true)
  })

  it('admin_set_membership is not callable by authenticated clients', async () => {
    if (skipIfNotRunning(ctx)) return
    const { error } = await ctx.userClient.rpc('admin_set_membership', {
      p_user_id: ctx.testUserId,
      p_tier: 'lifetime',
    })
    expect(error).toBeTruthy()
  })

  it('admin_set_membership rejects invalid tiers', async () => {
    if (skipIfNotRunning(ctx)) return
    const { data, error } = await ctx.adminClient.rpc('admin_set_membership', {
      p_user_id: ctx.testUserId,
      p_tier: 'platinum',
    })
    expect(error).toBeNull()
    expect((data as { ok: boolean; error: string }).ok).toBe(false)
  })

  it('is_active_member is not callable by authenticated clients', async () => {
    if (skipIfNotRunning(ctx)) return
    const { error } = await ctx.userClient.rpc('is_active_member', {
      p_user_id: ctx.testUserId,
    })
    expect(error).toBeTruthy()
  })

  it('is_active_member returns false after downgrading back to free', async () => {
    if (skipIfNotRunning(ctx)) return
    await ctx.adminClient.rpc('admin_set_membership', {
      p_user_id: ctx.testUserId,
      p_tier: 'free',
    })
    const { data, error } = await ctx.adminClient.rpc('is_active_member', {
      p_user_id: ctx.testUserId,
    })
    expect(error).toBeNull()
    expect(data).toBe(false)
  })
})
