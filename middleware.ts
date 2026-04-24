// ─────────────────────────────────────────────
// File: middleware.ts
// Purpose: Refreshes the Supabase auth token on every request and
//          enforces route-level access control.
//          See docs/AUTH.md Section 4 for the authoritative route
//          protection rules. Section 3 of that document contains a
//          code sample that was updated to match Section 4.
//
//          Route protection summary (AUTH.md Section 4):
//            Auth-only:        /leaderboard, /profile, /onboarding/*
//            Guest or authed:  /practice, /dojo, /library, /settings
//            Public:           /, /sign-up, /log-in, /credits, /auth/*
//
//          IMPORTANT: middleware is not a security boundary. It can be
//          bypassed. All sensitive data is protected by RLS at the
//          database level regardless of what this file does.
//          See docs/SECURITY.md Section 6.1 (CVE-2025-29927).
//
//          TODO: Once the profile service exists, add an onboarding
//          completion check here so that authenticated users without a
//          completed profile are redirected to /onboarding/step-1.
//          See staff review finding #7.
// Depends on: @supabase/ssr, environment variables
// ─────────────────────────────────────────────

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// ── Constants ─────────────────────────────────

// Routes that require a full account. Guests are redirected to /log-in.
// Source of truth: docs/AUTH.md Section 4.
// TODO: restore '/onboarding' before Sprint 3 auth wiring
// TODO: restore '/profile' before Sprint 3 auth wiring
const AUTHED_ONLY_ROUTES = ['/leaderboard']

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

  // Redirect unauthenticated users away from auth-only routes.
  const isAuthedOnly = AUTHED_ONLY_ROUTES.some((route) => pathname.startsWith(route))
  if (!user && isAuthedOnly) {
    const url = request.nextUrl.clone()
    url.pathname = '/log-in'
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from auth pages (sign-up, log-in).
  const isAuthPage = AUTH_PAGES.some((route) => pathname.startsWith(route))
  if (user && isAuthPage) {
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
