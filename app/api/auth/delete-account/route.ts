// ─────────────────────────────────────────────
// File: app/api/auth/delete-account/route.ts
// Purpose: POST handler for permanent account deletion. Verifies
//          CSRF origin, authenticates via server client getUser(),
//          requires typed confirmation. Re-authenticates email users
//          via password, or OAuth-only users via a signed reauth
//          cookie (set by the /reauth/[provider]/start flow).
//          Deletes via admin client. Cascade FKs handle table cleanup.
//          Clears all sb-* session cookies and reauth cookies.
// Depends on: services/supabase-server.ts, services/reauth-cookie.ts,
//             @supabase/supabase-js
// ─────────────────────────────────────────────

import { NextResponse, type NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/services/supabase-server'
import { createClient } from '@supabase/supabase-js'
import {
  verifyVerifiedToken,
  VERIFIED_COOKIE_NAME,
  CLEAR_COOKIE_OPTIONS,
} from '@/services/reauth-cookie'

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

const MAX_BODY_BYTES = 1024

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Byte-bounded body read: reject oversized payloads regardless of Content-Length header
  let rawText: string
  try {
    const bytes = await request.arrayBuffer()
    if (bytes.byteLength > MAX_BODY_BYTES) {
      return NextResponse.json({ error: 'Request too large' }, { status: 413 })
    }
    rawText = new TextDecoder().decode(bytes)
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  let body: { confirmation?: string; password?: string }
  try {
    body = JSON.parse(rawText) as { confirmation?: string; password?: string }
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // Load profile for username validation
  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  // Validate typed confirmation
  const expectedPhrase = `delete-${profile.username}`
  if (body.confirmation !== expectedPhrase) {
    return NextResponse.json({ error: 'Confirmation does not match' }, { status: 400 })
  }

  // Re-authentication: password for email users, signed cookie for OAuth-only
  const hasEmailIdentity = user.identities?.some((i) => i.provider === 'email') ?? false

  if (hasEmailIdentity) {
    if (!body.password) {
      return NextResponse.json({ error: 'Password required' }, { status: 400 })
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: body.password,
    })

    if (signInError) {
      return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
    }
  } else {
    // OAuth-only: require a valid verified reauth cookie
    const verifiedToken = request.cookies.get(VERIFIED_COOKIE_NAME)?.value
    if (!verifiedToken) {
      return NextResponse.json(
        { error: 'Re-authentication required. Please verify your identity first.' },
        { status: 401 },
      )
    }

    const verified = await verifyVerifiedToken(verifiedToken)
    if (!verified || verified.userId !== user.id) {
      return NextResponse.json(
        { error: 'Re-authentication expired or invalid. Please try again.' },
        { status: 401 },
      )
    }
  }

  // Delete via admin client (service role key, scoped to this handler)
  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )

  const { error: deleteError } = await adminSupabase.auth.admin.deleteUser(user.id)

  if (deleteError) {
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
  }

  // Clear all session and reauth cookies
  const response = NextResponse.json({ ok: true })
  for (const cookie of request.cookies.getAll()) {
    if (cookie.name.startsWith('sb-')) {
      response.cookies.set(cookie.name, '', { path: '/', maxAge: 0 })
    }
  }
  response.cookies.set(VERIFIED_COOKIE_NAME, '', CLEAR_COOKIE_OPTIONS)

  return response
}
