// ─────────────────────────────────────────────
// File: app/api/auth/sign-out/route.ts
// Purpose: POST handler for signing the user out server-side.
//          Clears the HTTP-only session cookie via Supabase SSR,
//          then redirects to the landing page.
//          Called from the Profile screen via a form POST (not fetch),
//          so the cookie is cleared before the browser navigates away.
//          Note: CSRF token protection is a planned future addition.
//          The SameSite cookie attribute (set by @supabase/ssr) provides
//          baseline cross-site protection in the interim. See staff
//          review finding #8.
// Depends on: services/supabase-server.ts
// ─────────────────────────────────────────────

import { createServerSupabaseClient } from '@/services/supabase-server'
import { NextResponse } from 'next/server'

// ── Handler ───────────────────────────────────

export async function POST(request: Request): Promise<NextResponse> {
  const supabase = await createServerSupabaseClient()
  await supabase.auth.signOut()

  // Derive the origin from the incoming request rather than relying on
  // NEXT_PUBLIC_SITE_URL, which can be missing or mismatched across
  // environments. See staff review finding #5.
  const { origin } = new URL(request.url)

  // 303 See Other: the correct status for POST-redirect-GET.
  // Unlike 301/302, 303 guarantees the browser switches to GET for the
  // redirect, preventing method-preservation issues on some clients.
  return NextResponse.redirect(`${origin}/`, { status: 303 })
}
