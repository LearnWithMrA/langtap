// ─────────────────────────────────────────────
// File: services/supabase-browser.ts
// Purpose: Supabase browser client factory. Used in client components
//          and hooks. Returns a client with the anon key only.
//          Service role key is never used here.
// Depends on: @supabase/ssr, environment variables
// ─────────────────────────────────────────────

import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

// ── Factory ───────────────────────────────────

// Call this inside a client component or hook, not at module level.
// Each call returns a new client instance scoped to the current browser session.
export function createBrowserSupabaseClient(): SupabaseClient {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
