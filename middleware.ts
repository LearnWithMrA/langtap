// ─────────────────────────────────────────────
// File: middleware.ts
// Purpose: Refreshes the Supabase auth token on every request and
//          enforces route-level access control.
//          See docs/AUTH.md Section 4 for the authoritative route
//          protection rules. Section 3 of that document contains a
//          code sample that was updated to match Section 4.
//
//          Route protection summary (AUTH.md Section 4):
//            Auth-only:        /dojo, /profile
//            Guest or authed:  /practice, /library, /settings, /leaderboard
//            Public:           /, /sign-up, /log-in, /credits, /auth/*
//
//          IMPORTANT: middleware is not a security boundary. It can be
//          bypassed. All sensitive data is protected by RLS at the
//          database level regardless of what this file does.
//          See docs/SECURITY.md Section 6.1 (CVE-2025-29927).
//
//          Authenticated users without a completed profile are
//          redirected to /onboarding/step-1 by the client-side
//          useAuth hook and the onboarding store check.
// Depends on: @supabase/ssr, environment variables
// ─────────────────────────────────────────────

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// ── Constants ─────────────────────────────────

// Guests hitting /profile are redirected to /sign-up (they already
// went through the guest flow, so sign-up is the next step).
// All other routes are open to guests.
const GUEST_TO_SIGNUP_ROUTES = ['/profile', '/dojo']

// Auth pages. Authenticated users are redirected to /practice.
const AUTH_PAGES = ['/sign-up', '/log-in']

// ── Middleware ────────────────────────────────

export async function middleware(request: NextRequest): Promise<NextResponse> {
  // supabaseResponse must be returned (or a response derived from it) so that
  // the refreshed session cookie is written back to the browser.
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Write updated cookies onto the request first so server components
          // see them, then onto the response so the browser receives them.
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // getUser() verifies the JWT with Supabase over the network.
  // Never use getSession() here: it only reads the cookie and can be spoofed.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  const isAnonymous = user?.is_anonymous ?? false
  const isPermanentUser = user !== null && !isAnonymous

  // Redirect guests and anonymous users from /profile to /sign-up.
  const isGuestToSignup = GUEST_TO_SIGNUP_ROUTES.some((route) => pathname.startsWith(route))
  if (!isPermanentUser && isGuestToSignup) {
    const url = request.nextUrl.clone()
    url.pathname = '/sign-up'
    return NextResponse.redirect(url)
  }

  // Redirect permanent authenticated users away from auth pages (sign-up, log-in).
  // Anonymous users can still access auth pages to sign up.
  const isAuthPage = AUTH_PAGES.some((route) => pathname.startsWith(route))
  if (isPermanentUser && isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/practice'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

// ── Matcher ───────────────────────────────────

export const config = {
  matcher: [
    // Run on all paths except:
    //   _next/static  - compiled assets
    //   _next/image   - image optimisation
    //   favicon.ico   - browser favicon request
    //   api/          - route handlers (no auth refresh needed)
    //   auth/callback - PKCE code exchange (must not be intercepted)
    //   static assets - image, video, font files
    '/((?!_next/static|_next/image|favicon.ico|api/|auth/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)',
  ],
}
