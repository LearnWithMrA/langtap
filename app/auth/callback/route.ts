// ─────────────────────────────────────────────
// File: app/auth/callback/route.ts
// Purpose: GET handler for the Supabase PKCE auth callback.
//          Exchanges the one-time code in the URL for a session and
//          redirects the user to their intended destination.
//          Used by: password reset emails, future OAuth flows.
//          URL: /auth/callback
//          Note: this file is NOT inside app/(auth)/ because the (auth)
//          route group does not add a URL segment. This route must live
//          at app/auth/callback/ to resolve to /auth/callback, which
//          is the redirect URL registered in the Supabase dashboard.
// Depends on: services/supabase-server.ts
// ─────────────────────────────────────────────

import { createServerSupabaseClient } from '@/services/supabase-server'
import { NextResponse } from 'next/server'

// ── Handler ───────────────────────────────────

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  // Sanitize the next param to prevent open redirects.
  // Only relative paths are accepted (starts with / but not //).
  const rawNext = searchParams.get('next') ?? '/practice'
  const redirectTo = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/practice'

  if (code) {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(`${origin}${redirectTo}`)
    }

    // TODO: replace with structured logging once a logger utility exists.
    // Do not log the full error object - it may contain token details.
    // See staff review finding #6.
  }

  // Redirect to log-in with an error flag. The log-in page reads this
  // param and shows a human-readable message to the user.
  return NextResponse.redirect(`${origin}/log-in?error=auth_callback_failed`)
}
