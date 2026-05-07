// ─────────────────────────────────────────────
// File: app/auth/callback/route.ts
// Purpose: GET handler for the Supabase PKCE auth callback.
//          Exchanges the one-time code in the URL for a session and
//          redirects the user to their intended destination.
//          Used by: password reset emails, OAuth flows (Google, Apple).
//          Checks onboarding status to route new users correctly.
//          Handles OAuth error params with user-friendly redirect.
//          Retries profile load once if trigger hasn't fired yet.
// Depends on: services/supabase-server.ts
// ─────────────────────────────────────────────

import { createServerSupabaseClient } from '@/services/supabase-server'
import { NextResponse } from 'next/server'

// ── Helpers ───────────────────────────────────

function sanitizeNext(raw: string | null): string {
  const fallback = '/home'
  if (!raw) return fallback
  if (raw.startsWith('/') && !raw.startsWith('//')) return raw
  return fallback
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function authErrorRedirect(origin: string, message: string): NextResponse {
  return NextResponse.redirect(`${origin}/?auth_error=${encodeURIComponent(message)}`)
}

// ── Handler ───────────────────────────────────

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams, origin } = new URL(request.url)

  const oauthError = searchParams.get('error')
  if (oauthError) {
    const description = searchParams.get('error_description') ?? 'Sign-in failed'
    return authErrorRedirect(origin, description)
  }

  const code = searchParams.get('code')
  const redirectTo = sanitizeNext(searchParams.get('next'))

  if (!code) {
    return authErrorRedirect(origin, 'No auth code received')
  }

  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return authErrorRedirect(origin, 'Sign-in failed. Please try again.')
  }

  // Capture user once after exchange
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return authErrorRedirect(origin, 'Could not verify your identity. Please try again.')
  }

  // For password reset callbacks, go directly to the requested page
  if (redirectTo.includes('update-password')) {
    return NextResponse.redirect(`${origin}${redirectTo}`)
  }

  // Check onboarding status
  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_complete')
    .eq('id', user.id)
    .single()

  if (profile) {
    const dest = profile.onboarding_complete ? '/home' : '/onboarding/step-1'
    return NextResponse.redirect(`${origin}${dest}`)
  }

  // Profile may not exist yet if the trigger hasn't fired. Retry once.
  await sleep(500)

  const { data: retryProfile } = await supabase
    .from('profiles')
    .select('onboarding_complete')
    .eq('id', user.id)
    .single()

  if (retryProfile) {
    const dest = retryProfile.onboarding_complete ? '/home' : '/onboarding/step-1'
    return NextResponse.redirect(`${origin}${dest}`)
  }

  return NextResponse.redirect(`${origin}/onboarding/step-1`)
}
