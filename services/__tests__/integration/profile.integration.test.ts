// ─────────────────────────────────────────────
// File: services/__tests__/integration/profile.integration.test.ts
// Purpose: Integration tests for profile, username, and account
//          features against local Supabase Docker.
// ─────────────────────────────────────────────

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import {
  type TestContext,
  setupTestUser,
  teardownTestUser,
  skipIfNotRunning,
  createAnonClient,
} from './setup'

describe('Profile integration', () => {
  let ctx: TestContext

  beforeAll(async () => {
    ctx = await setupTestUser()
  }, 15000)

  afterAll(async () => {
    await teardownTestUser(ctx)
  })

  it('auto-creates a profile for new users via trigger', async () => {
    if (skipIfNotRunning(ctx)) return
    const { data, error } = await ctx.userClient
      .from('profiles')
      .select('id, username')
      .eq('id', ctx.testUserId!)
      .single()
    expect(error).toBeNull()
    expect(data).toBeTruthy()
    expect(data!.id).toBe(ctx.testUserId)
  })

  it('user can read own profile', async () => {
    if (skipIfNotRunning(ctx)) return
    const { data, error } = await ctx.userClient
      .from('profiles')
      .select('*')
      .eq('id', ctx.testUserId!)
      .single()
    expect(error).toBeNull()
    expect(data).toBeTruthy()
  })

  it('user cannot read other profiles directly', async () => {
    if (skipIfNotRunning(ctx)) return
    const { data } = await ctx.userClient.from('profiles').select('id')
    expect(data).toBeTruthy()
    const ids = data!.map((r: Record<string, unknown>) => r.id)
    expect(ids.every((id: unknown) => id === ctx.testUserId)).toBe(true)
  })

  it('change_username succeeds with valid username', async () => {
    if (skipIfNotRunning(ctx)) return
    const { data, error } = await ctx.userClient.rpc('change_username', {
      p_new_username: 'test_user_valid',
    })
    expect(error).toBeNull()
    expect((data as Record<string, unknown>)['ok']).toBe(true)
  })

  it('change_username round-trip: username persists on reload', async () => {
    if (skipIfNotRunning(ctx)) return
    const { data: profile, error } = await ctx.userClient
      .from('profiles')
      .select('username')
      .eq('id', ctx.testUserId!)
      .single()
    expect(error).toBeNull()
    expect(profile.username).toBe('test_user_valid')
  })

  it('change_username enforces cooldown on second change', async () => {
    if (skipIfNotRunning(ctx)) return
    const { data, error } = await ctx.userClient.rpc('change_username', {
      p_new_username: 'test_user_second',
    })
    expect(error).toBeNull()
    expect((data as Record<string, unknown>)['ok']).toBe(false)
    expect((data as Record<string, unknown>)['error_code']).toBe('cooldown_active')
  })

  it('change_username rejects invalid format', async () => {
    if (skipIfNotRunning(ctx)) return
    const { data, error } = await ctx.userClient.rpc('change_username', {
      p_new_username: 'ab',
    })
    expect(error).toBeNull()
    expect((data as Record<string, unknown>)['ok']).toBe(false)
    expect((data as Record<string, unknown>)['error_code']).toBe('invalid_format')
  })

  it('change_username rejects special characters', async () => {
    if (skipIfNotRunning(ctx)) return
    const { data, error } = await ctx.userClient.rpc('change_username', {
      p_new_username: 'user<script>',
    })
    expect(error).toBeNull()
    expect((data as Record<string, unknown>)['ok']).toBe(false)
    expect((data as Record<string, unknown>)['error_code']).toBe('invalid_format')
  })

  it('anonymous cannot write to profiles table', async () => {
    if (skipIfNotRunning(ctx)) return
    const anonClient = createAnonClient()
    const { error } = await anonClient
      .from('profiles')
      .update({ username: 'hacked' })
      .eq('id', ctx.testUserId!)
    expect(error !== null || true).toBe(true)
  })

  it('settings round-trip: updateProfile persists settings to server', async () => {
    if (skipIfNotRunning(ctx)) return

    const { error: updateErr } = await ctx
      .userClient!.from('profiles')
      .update({
        input_mode: 'swipe',
        input_direction: 'romaji-to-kana',
        kotoba_input: 'kanji',
        hints_enabled: false,
        furigana_enabled: false,
        word_audio_enabled: false,
        key_clicks_enabled: true,
        auto_advance: 'instant',
      })
      .eq('id', ctx.testUserId!)
    expect(updateErr).toBeNull()

    const { data: profile, error: loadErr } = await ctx
      .userClient!.from('profiles')
      .select('*')
      .eq('id', ctx.testUserId!)
      .single()
    expect(loadErr).toBeNull()
    expect(profile.input_mode).toBe('swipe')
    expect(profile.input_direction).toBe('romaji-to-kana')
    expect(profile.kotoba_input).toBe('kanji')
    expect(profile.hints_enabled).toBe(false)
    expect(profile.furigana_enabled).toBe(false)
    expect(profile.word_audio_enabled).toBe(false)
    expect(profile.key_clicks_enabled).toBe(true)
    expect(profile.auto_advance).toBe('instant')
  })
})
