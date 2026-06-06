// ─────────────────────────────────────────────
// File: services/bug-report.service.ts
// Purpose: Client-side service for submitting bug reports. Calls
//          the /api/bug-report route handler via fetch. Never
//          calls Supabase directly.
// Depends on: types/bug-report.types.ts
// ─────────────────────────────────────────────

import type { BugReportInput, BugReportAppState } from '@/types/bug-report.types'

// ── Types ─────────────────────────────────────

type SubmitResult = { ok: true } | { ok: false; error: string; status: number }

// ── Main exports ──────────────────────────────

export async function submitBugReport(
  input: BugReportInput,
  appState: BugReportAppState,
): Promise<SubmitResult> {
  const formData = new FormData()
  formData.append('type', input.type)
  formData.append('description', input.description)
  formData.append('app_state', JSON.stringify(appState))
  formData.append('user_agent', navigator.userAgent)

  if (input.screenshot) {
    formData.append('screenshot', input.screenshot)
  }

  let response: Response
  try {
    response = await fetch('/api/bug-report', {
      method: 'POST',
      body: formData,
    })
  } catch {
    return { ok: false, error: 'Network error. Please try again.', status: 0 }
  }

  if (response.ok) {
    return { ok: true }
  }

  const body = (await response.json().catch(() => ({ error: 'Unknown error' }))) as {
    error?: string
  }

  return {
    ok: false,
    error: body.error ?? 'Failed to submit report',
    status: response.status,
  }
}
