// ─────────────────────────────────────────────
// File: app/auth/callback/route.ts
// Purpose: GET handler for the Supabase PKCE auth callback.
//          Exchanges the one-time code in the URL for a session and
//          redirects the user to their intended destination.
//          Used by: password reset emails, OAuth flows (Google, Apple),
//          and delete-account re-authentication.
//          Checks onboarding status to route new users correctly.
//          Handles OAuth error params with user-friendly redirect.
//          Retries profile load once if trigger hasn't fired yet.
//          For delete re-auth: verifies pending cookie, mints
//          verified cookie, redirects to /profile?delete_reauth=success.
// Depends on: services/supabase-server.ts, services/reauth-cookie.ts
// ─────────────────────────────────────────────

import { createServerSupabaseClient } from '@/services/supabase-server'
import { NextResponse, type NextRequest } from 'next/server'
import {
  verifyPendingToken,
  createVerifiedToken,
  PENDING_COOKIE_NAME,
  VERIFIED_COOKIE_NAME,
  COOKIE_OPTIONS,
  CLEAR_COOKIE_OPTIONS,
} from '@/services/reauth-cookie'

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

export async function GET(request: NextRequest): Promise<NextResponse> {
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

  // Delete re-auth flow: requires both the next marker AND a valid pending cookie.
  // The marker narrows scope so a stale pending cookie from an abandoned reauth
  // does not accidentally satisfy during an unrelated OAuth sign-in.
  const isDeleteReauth = redirectTo.includes('delete_reauth=1')
  const pendingToken = request.cookies.get(PENDING_COOKIE_NAME)?.value

  if (isDeleteReauth && pendingToken) {
    const pending = await verifyPendingToken(pendingToken)

    if (!pending || pending.userId !== user.id) {
      const response = NextResponse.redirect(`${origin}/profile?delete_reauth=failed`)
      response.cookies.set(PENDING_COOKIE_NAME, '', CLEAR_COOKIE_OPTIONS)
      return response
    }

    const verifiedToken = await createVerifiedToken(user.id, pending.provider)
    const response = NextResponse.redirect(`${origin}/profile?delete_reauth=success`)
    response.cookies.set(VERIFIED_COOKIE_NAME, verifiedToken, COOKIE_OPTIONS)
    response.cookies.set(PENDING_COOKIE_NAME, '', CLEAR_COOKIE_OPTIONS)
    return response
  }

  // Helper: if a stale pending cookie was found on a non-reauth callback, clear it
  function clearStalePending(response: NextResponse): NextResponse {
    if (pendingToken) {
      response.cookies.set(PENDING_COOKIE_NAME, '', CLEAR_COOKIE_OPTIONS)
    }
    return response
  }

  // For password reset callbacks, go directly to the requested page
  if (redirectTo.includes('update-password')) {
    return clearStalePending(NextResponse.redirect(`${origin}${redirectTo}`))
  }

  // Check onboarding status
  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_complete')
    .eq('id', user.id)
    .single()

  if (profile) {
    const dest = profile.onboarding_complete ? '/home' : '/onboarding/step-1'
    return clearStalePending(NextResponse.redirect(`${origin}${dest}`))
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
    return clearStalePending(NextResponse.redirect(`${origin}${dest}`))
  }

  return clearStalePending(NextResponse.redirect(`${origin}/onboarding/step-1`))
}
