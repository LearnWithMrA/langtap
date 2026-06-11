// ─────────────────────────────────────────────
// File: app/api/auth/sign-out/route.ts
// Purpose: POST handler for signing the user out server-side.
//          Clears the HTTP-only session cookie via Supabase SSR,
//          then redirects to the landing page.
//          Called from the Profile screen via a form POST (not fetch),
//          so the cookie is cleared before the browser navigates away.
//          CSRF: origin/Sec-Fetch-Site checks below, layered on top of
//          the SameSite cookie attribute set by @supabase/ssr.
// Depends on: services/supabase-server.ts
// ─────────────────────────────────────────────

import { createServerSupabaseClient } from '@/services/supabase-server'
import { NextResponse } from 'next/server'

// ── Handler ───────────────────────────────────

export async function POST(request: Request): Promise<NextResponse> {
  // Derive the origin from the incoming request rather than relying on
  // NEXT_PUBLIC_SITE_URL, which can be missing or mismatched across
  // environments. See staff review finding #5.
  const { origin } = new URL(request.url)

  // CSRF: browsers always send the Origin header on cross-site POSTs.
  // A mismatched or cross-site request is rejected before signing out.
  const requestOrigin = request.headers.get('origin')
  if (requestOrigin && requestOrigin.replace(/\/$/, '') !== origin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const fetchSite = request.headers.get('sec-fetch-site')
  if (fetchSite && fetchSite !== 'same-origin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = await createServerSupabaseClient()
  await supabase.auth.signOut()

  // 303 See Other: the correct status for POST-redirect-GET.
  // Unlike 301/302, 303 guarantees the browser switches to GET for the
  // redirect, preventing method-preservation issues on some clients.
  return NextResponse.redirect(`${origin}/`, { status: 303 })
}
