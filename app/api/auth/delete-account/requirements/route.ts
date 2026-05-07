// ─────────────────────────────────────────────
// File: app/api/auth/delete-account/requirements/route.ts
// Purpose: GET handler that returns the re-authentication method
//          required for the current user to delete their account.
//          Email-identity users need a password. OAuth-only users
//          need to re-authenticate via their OAuth provider.
// Depends on: services/supabase-server.ts
// ─────────────────────────────────────────────

import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/services/supabase-server'

// ── Types ─────────────────────────────────────

type RequirementsResponse =
  | { method: 'password' }
  | { method: 'oauth'; provider: 'google' | 'apple' }

// ── Handler ───────────────────────────────────

export async function GET(): Promise<NextResponse> {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const identities = user.identities ?? []
  const hasEmail = identities.some((i) => i.provider === 'email')

  if (hasEmail) {
    return NextResponse.json({ method: 'password' } satisfies RequirementsResponse)
  }

  const oauthIdentity = identities.find((i) => i.provider === 'google' || i.provider === 'apple')

  if (oauthIdentity) {
    const provider = oauthIdentity.provider as 'google' | 'apple'
    return NextResponse.json({ method: 'oauth', provider } satisfies RequirementsResponse)
  }

  return NextResponse.json({ error: 'No recognized identity provider' }, { status: 400 })
}
