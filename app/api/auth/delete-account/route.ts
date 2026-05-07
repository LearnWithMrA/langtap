// ─────────────────────────────────────────────
// File: app/api/auth/delete-account/route.ts
// Purpose: POST handler for permanent account deletion. Verifies
//          CSRF origin, authenticates via server client getUser(),
//          requires typed confirmation, re-authenticates email
//          users via password, then deletes via admin client.
//          Cascade FKs handle all table cleanup. Clears all sb-*
//          session cookies.
// Depends on: services/supabase-server.ts, @supabase/supabase-js
// ─────────────────────────────────────────────

import { NextResponse, type NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/services/supabase-server'
import { createClient } from '@supabase/supabase-js'

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

  const contentLength = request.headers.get('content-length')
  if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Request too large' }, { status: 413 })
  }

  let body: { confirmation?: string; password?: string }
  try {
    body = (await request.json()) as { confirmation?: string; password?: string }
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

  // Check if user has an email identity (needs password re-auth)
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

  // Clear all sb-* session cookies
  const response = NextResponse.json({ ok: true })
  for (const cookie of request.cookies.getAll()) {
    if (cookie.name.startsWith('sb-')) {
      response.cookies.set(cookie.name, '', { path: '/', maxAge: 0 })
    }
  }

  return response
}
