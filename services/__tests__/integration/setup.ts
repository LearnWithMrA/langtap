// ─────────────────────────────────────────────
// File: services/__tests__/integration/setup.ts
// Purpose: Shared setup for Supabase integration tests.
//          Creates a test user, provides authenticated and
//          anonymous Supabase clients. Cleans up on teardown.
// ─────────────────────────────────────────────

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// ── Local Supabase config ────────────────────
// Set SUPABASE_LOCAL_ANON_KEY and SUPABASE_LOCAL_SERVICE_KEY env vars
// before running integration tests. Get values from `supabase status`.

const LOCAL_URL = process.env['SUPABASE_LOCAL_URL'] ?? 'http://127.0.0.1:54321'
const LOCAL_ANON_KEY = process.env['SUPABASE_LOCAL_ANON_KEY'] ?? ''
const LOCAL_SERVICE_KEY = process.env['SUPABASE_LOCAL_SERVICE_KEY'] ?? ''

const TEST_PASSWORD = 'test-password-123!'

// ── Client factories ─────────────────────────

export function createAdminClient(): SupabaseClient {
  return createClient(LOCAL_URL, LOCAL_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export function createAnonClient(): SupabaseClient {
  return createClient(LOCAL_URL, LOCAL_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

// ── Connection check ─────────────────────────

export async function isSupabaseRunning(): Promise<boolean> {
  if (!LOCAL_ANON_KEY || !LOCAL_SERVICE_KEY) return false
  try {
    const res = await fetch(`${LOCAL_URL}/rest/v1/`, {
      headers: { apikey: LOCAL_ANON_KEY },
    })
    return res.ok
  } catch {
    return false
  }
}

// ── Test context ─────────────────────────────

export type TestContext = {
  running: boolean
  adminClient: SupabaseClient | null
  userClient: SupabaseClient | null
  testUserId: string | null
}

let testCounter = 0

export async function setupTestUser(): Promise<TestContext> {
  const running = await isSupabaseRunning()
  if (!running) {
    return { running: false, adminClient: null, userClient: null, testUserId: null }
  }

  testCounter++
  const testEmail = `integration-test-${testCounter}-${Math.random().toString(36).slice(2, 8)}@langtap.test`

  const adminClient = createAdminClient()
  const userClient = createAnonClient()

  const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
    email: testEmail,
    password: TEST_PASSWORD,
    email_confirm: true,
  })
  if (createErr || !created.user) {
    return { running: false, adminClient, userClient, testUserId: null }
  }

  const testUserId = created.user.id

  const { error: signInErr } = await userClient.auth.signInWithPassword({
    email: testEmail,
    password: TEST_PASSWORD,
  })
  if (signInErr) {
    return { running: false, adminClient, userClient, testUserId }
  }

  return { running: true, adminClient, userClient, testUserId }
}

export async function teardownTestUser(ctx: TestContext | undefined): Promise<void> {
  if (!ctx?.running || !ctx.testUserId || !ctx.adminClient) return
  await ctx.adminClient.auth.admin.deleteUser(ctx.testUserId)
}

export function skipIfNotRunning(ctx: TestContext | undefined): boolean {
  if (!ctx?.running) return true
  return false
}
