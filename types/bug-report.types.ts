// ─────────────────────────────────────────────
// File: types/bug-report.types.ts
// Purpose: Type definitions for the bug reporting feature.
//          Covers report types, database rows, and client input.
// Depends on: nothing
// ─────────────────────────────────────────────

// ── Types ─────────────────────────────────────

export type BugReportType = 'bug' | 'feature' | 'other'

export type BugReport = {
  id: string
  user_id: string
  type: BugReportType
  description: string
  screenshot_path: string | null
  app_state: BugReportAppState | null
  user_agent: string | null
  created_at: string
}

export type BugReportAppState = {
  page: string
  input_mode: string
}

export type BugReportInput = {
  type: BugReportType
  description: string
  screenshot?: File
}

export type BugReportSubmitStatus = 'idle' | 'submitting' | 'success' | 'error'
