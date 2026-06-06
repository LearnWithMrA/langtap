// ─────────────────────────────────────────────
// File: app/api/bug-report/route.ts
// Purpose: POST handler for bug report submission. Validates auth,
//          enforces server-side rate gate (60s between reports per
//          user), validates description length and file MIME/size,
//          uploads screenshot via service role, inserts bug_reports
//          row via service role. Client never writes to Supabase
//          directly.
// Depends on: services/supabase-server.ts, @supabase/supabase-js
// ─────────────────────────────────────────────

import { NextResponse, type NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/services/supabase-server'
import { createClient } from '@supabase/supabase-js'

// ── Constants ─────────────────────────────────

const MAX_DESCRIPTION_LENGTH = 2000
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024
const ALLOWED_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp'])
const RATE_LIMIT_SECONDS = 60
const MAX_BODY_BYTES = 6 * 1024 * 1024
const MAX_USER_AGENT_LENGTH = 500
const MAX_APP_STATE_PAGE_LENGTH = 200
const MAX_APP_STATE_INPUT_MODE_LENGTH = 20

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

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const contentLength = request.headers.get('content-length')
  if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Request too large' }, { status: 413 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const type = formData.get('type')
  const description = formData.get('description')
  const screenshot = formData.get('screenshot')
  const appState = formData.get('app_state')
  const userAgent = formData.get('user_agent')

  if (typeof type !== 'string' || !['bug', 'feature', 'other'].includes(type)) {
    return NextResponse.json({ error: 'Invalid report type' }, { status: 400 })
  }

  if (typeof description !== 'string' || description.trim().length === 0) {
    return NextResponse.json({ error: 'Description is required' }, { status: 400 })
  }

  if (description.length > MAX_DESCRIPTION_LENGTH) {
    return NextResponse.json(
      { error: `Description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer` },
      { status: 400 },
    )
  }

  if (screenshot !== null && !(screenshot instanceof File)) {
    return NextResponse.json({ error: 'Invalid screenshot' }, { status: 400 })
  }

  if (screenshot instanceof File) {
    if (!ALLOWED_MIME_TYPES.has(screenshot.type)) {
      return NextResponse.json({ error: 'Screenshot must be PNG, JPEG, or WebP' }, { status: 400 })
    }
    if (screenshot.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: 'Screenshot must be 5MB or smaller' }, { status: 400 })
    }
  }

  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  if (user.is_anonymous) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )

  // Rate gate: reject if last report was within 60 seconds.
  // Known: this check-then-insert has a small race window under concurrent
  // requests. Acceptable at soft-launch volume; replace with an advisory
  // lock or atomic RPC when Sprint 17 adds distributed rate limiting.
  const { data: recentReport } = await adminSupabase
    .from('bug_reports')
    .select('created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (recentReport) {
    const lastReportTime = new Date(recentReport.created_at).getTime()
    const now = Date.now()
    const secondsSinceLastReport = (now - lastReportTime) / 1000

    if (secondsSinceLastReport < RATE_LIMIT_SECONDS) {
      const retryAfter = Math.ceil(RATE_LIMIT_SECONDS - secondsSinceLastReport)
      return NextResponse.json(
        { error: 'Please wait before submitting another report' },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } },
      )
    }
  }

  // Upload screenshot if provided
  let screenshotPath: string | null = null

  if (screenshot instanceof File) {
    const ext = screenshot.name.split('.').pop() ?? 'png'
    const fileName = `${user.id}/${crypto.randomUUID()}.${ext}`

    const { error: uploadError } = await adminSupabase.storage
      .from('bug-reports')
      .upload(fileName, screenshot, {
        contentType: screenshot.type,
        upsert: false,
      })

    if (uploadError) {
      return NextResponse.json({ error: 'Failed to upload screenshot' }, { status: 500 })
    }

    screenshotPath = fileName
  }

  // Parse app_state if provided
  let parsedAppState: { page: string; input_mode: string } | null = null
  if (typeof appState === 'string' && appState.length > 0) {
    try {
      const parsed = JSON.parse(appState) as { page?: string; input_mode?: string }
      if (typeof parsed.page === 'string' && typeof parsed.input_mode === 'string') {
        parsedAppState = {
          page: parsed.page.slice(0, MAX_APP_STATE_PAGE_LENGTH),
          input_mode: parsed.input_mode.slice(0, MAX_APP_STATE_INPUT_MODE_LENGTH),
        }
      }
    } catch {
      // Ignore malformed app_state
    }
  }

  const { error: insertError } = await adminSupabase.from('bug_reports').insert({
    user_id: user.id,
    type,
    description: description.trim(),
    screenshot_path: screenshotPath,
    app_state: parsedAppState,
    user_agent: typeof userAgent === 'string' ? userAgent.slice(0, MAX_USER_AGENT_LENGTH) : null,
  })

  if (insertError) {
    return NextResponse.json({ error: 'Failed to submit report' }, { status: 500 })
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}
