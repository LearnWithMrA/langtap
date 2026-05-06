// ─────────────────────────────────────────────
// File: app/api/sync/route.ts
// Purpose: Beacon endpoint for pagehide/visibilitychange sync.
//          Receives dirty mastery and word mastery data from
//          sendBeacon, calls checkpoint RPCs server-side.
//          Content-Type flexibility: accepts both application/json
//          and text/plain (sendBeacon edge case). This flexibility
//          is scoped to this route only.
// Depends on: services/supabase-server.ts
// ─────────────────────────────────────────────

import { createServerSupabaseClient } from '@/services/supabase-server'
import { NextResponse, type NextRequest } from 'next/server'

// ── Constants ─────────────────────────────────

const MAX_PAYLOAD_BYTES = 100_000

// ── Types ─────────────────────────────────────

type SyncPayload = {
  mastery_epoch?: number
  mastery_rows?: Array<{ character_id: string; score: number; learning_score: number }>
  mastery_unlock_ids?: string[]
  word_epoch?: number
  word_rows?: Array<{ word_id: string; score: number }>
  word_unlock_ids?: string[]
}

// ── Route handler ─────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  // CSRF: Origin check
  const origin = request.headers.get('origin')
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (origin && siteUrl && !origin.startsWith(siteUrl)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Sec-Fetch-Site: best-effort (present: must be same-origin; absent: allow)
  const fetchSite = request.headers.get('sec-fetch-site')
  if (fetchSite && fetchSite !== 'same-origin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Payload size check
  const contentLength = request.headers.get('content-length')
  if (contentLength && parseInt(contentLength, 10) > MAX_PAYLOAD_BYTES) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 })
  }

  // Parse JSON body (accepts application/json and text/plain for sendBeacon)
  let payload: SyncPayload
  try {
    const text = await request.text()
    payload = JSON.parse(text) as SyncPayload
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Auth: derive user from session cookies
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Call checkpoint RPCs (stale epoch silently dropped for beacons)
  const promises: Array<Promise<unknown>> = []

  if (
    payload.mastery_rows &&
    payload.mastery_rows.length > 0 &&
    payload.mastery_epoch !== undefined
  ) {
    promises.push(
      supabase
        .rpc('checkpoint_mastery', { p_epoch: payload.mastery_epoch, p_rows: payload.mastery_rows })
        .then(() => undefined) as Promise<unknown>,
    )
  }

  if (
    payload.mastery_unlock_ids &&
    payload.mastery_unlock_ids.length > 0 &&
    payload.mastery_epoch !== undefined
  ) {
    promises.push(
      supabase
        .rpc('checkpoint_manual_unlocks', {
          p_epoch: payload.mastery_epoch,
          p_ids: payload.mastery_unlock_ids,
        })
        .then(() => undefined) as Promise<unknown>,
    )
  }

  if (payload.word_rows && payload.word_rows.length > 0 && payload.word_epoch !== undefined) {
    promises.push(
      supabase
        .rpc('checkpoint_word_mastery', {
          p_epoch: payload.word_epoch,
          p_rows: payload.word_rows,
        })
        .then(() => undefined) as Promise<unknown>,
    )
  }

  if (
    payload.word_unlock_ids &&
    payload.word_unlock_ids.length > 0 &&
    payload.word_epoch !== undefined
  ) {
    promises.push(
      supabase
        .rpc('checkpoint_word_manual_unlocks', {
          p_epoch: payload.word_epoch,
          p_ids: payload.word_unlock_ids,
        })
        .then(() => undefined) as Promise<unknown>,
    )
  }

  await Promise.allSettled(promises)

  return NextResponse.json({ ok: true })
}
