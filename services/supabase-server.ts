// ─────────────────────────────────────────────
// File: services/supabase-server.ts
// Purpose: Supabase server client factory. Used in server components,
//          route handlers, and middleware. Reads and writes session
//          cookies via next/headers.
//          IMPORTANT: always call this inside a request handler function,
//          never at module level. A module-level instance on Vercel can
//          persist between requests and leak one user's session into
//          another user's request. See docs/SECURITY.md Section 6.2.
// Depends on: @supabase/ssr, next/headers, environment variables
// ─────────────────────────────────────────────

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { SupabaseClient } from '@supabase/supabase-js'

// ── Factory ───────────────────────────────────

// Async because next/headers cookies() is async in Next.js 15.
// Creates a new client per request using the current cookie store.
export async function createServerSupabaseClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // Attempted from a Server Component where cookies are read-only.
            // Safe to ignore: middleware handles session refresh and cookie
            // writing for every request before server components render.
          }
        },
      },
    },
  )
}
