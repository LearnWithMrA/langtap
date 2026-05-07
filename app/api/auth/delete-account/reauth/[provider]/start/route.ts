// ─────────────────────────────────────────────
// File: app/api/auth/delete-account/reauth/[provider]/start/route.ts
// Purpose: POST handler that initiates OAuth re-authentication for
//          account deletion. Sets a signed pending cookie and
//          redirects the browser to the OAuth provider. Called via
//          form POST from the Profile delete dialog.
//          Supported providers: google, apple.
// Depends on: services/supabase-server.ts, services/reauth-cookie.ts
// ─────────────────────────────────────────────

import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createPendingToken, PENDING_COOKIE_NAME, COOKIE_OPTIONS } from '@/services/reauth-cookie'

// ── Constants ─────────────────────────────────

const ALLOWED_PROVIDERS = new Set(['google', 'apple'])

// ── Helpers ───────────────────────────────────

function isAllowedOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  const requestOrigin = new URL(request.url).origin

  if (origin) return origin === requestOrigin
  if (referer) {
    try {
      return new URL(referer).origin === requestOrigin
    } catch {
      return false
    }
  }
  return false
}

// ── Handler ───────────────────────────────────

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
): Promise<NextResponse> {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { provider } = await params

  if (!ALLOWED_PROVIDERS.has(provider)) {
    return NextResponse.json({ error: 'Unsupported provider' }, { status: 400 })
  }

  // Collect cookies that Supabase needs to set (PKCE code_verifier)
  const pendingSupabaseCookies: Array<{
    name: string
    value: string
    options: Record<string, unknown>
  }> = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          pendingSupabaseCookies.push(...cookiesToSet)
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // Verify the requested provider belongs to the current user
  const identities = user.identities ?? []
  const hasProvider = identities.some((i) => i.provider === provider)
  if (!hasProvider) {
    return NextResponse.json({ error: 'Provider does not match your account' }, { status: 400 })
  }

  const requestOrigin = new URL(request.url).origin
  const redirectTo = `${requestOrigin}/auth/callback?next=/profile?delete_reauth=1`

  // Google: prompt=login forces re-authentication.
  // Apple: no equivalent OIDC param exists. Apple may auto-complete
  // without a fresh challenge if the user has an active Apple session.
  // The signed cookie + user-ID binding still protects against misuse.
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider as 'google' | 'apple',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
      queryParams: provider === 'google' ? { prompt: 'login' } : {},
    },
  })

  if (error || !data?.url) {
    return NextResponse.json({ error: 'Failed to start re-authentication' }, { status: 500 })
  }

  const pendingToken = await createPendingToken(user.id, provider)
  // 303 See Other: browser must follow the redirect with GET, not POST
  const response = NextResponse.redirect(data.url, 303)

  // Carry over PKCE cookies from Supabase
  for (const { name, value, options } of pendingSupabaseCookies) {
    response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
  }

  // Set the signed pending cookie
  response.cookies.set(PENDING_COOKIE_NAME, pendingToken, COOKIE_OPTIONS)

  return response
}
