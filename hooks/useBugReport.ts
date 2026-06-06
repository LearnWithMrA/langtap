// ─────────────────────────────────────────────
// File: hooks/useBugReport.ts
// Purpose: React hook for bug report submission. Manages submit
//          state (idle/submitting/success/error) and client-side
//          cooldown. Calls bug-report.service.ts.
// Depends on: services/bug-report.service.ts, types/bug-report.types.ts
// ─────────────────────────────────────────────

'use client'

import { useState, useCallback, useRef } from 'react'
import { submitBugReport } from '@/services/bug-report.service'
import type {
  BugReportInput,
  BugReportAppState,
  BugReportSubmitStatus,
} from '@/types/bug-report.types'

// ── Constants ─────────────────────────────────

const CLIENT_COOLDOWN_MS = 30_000

// ── Hook ──────────────────────────────────────

export function useBugReport(): {
  status: BugReportSubmitStatus
  error: string | null
  cooldownActive: boolean
  submit: (input: BugReportInput, appState: BugReportAppState) => Promise<void>
  reset: () => void
} {
  const [status, setStatus] = useState<BugReportSubmitStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [cooldownActive, setCooldownActive] = useState(false)
  const cooldownTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const submit = useCallback(
    async (input: BugReportInput, appState: BugReportAppState): Promise<void> => {
      if (cooldownActive) return

      setStatus('submitting')
      setError(null)

      let result: Awaited<ReturnType<typeof submitBugReport>>
      try {
        result = await submitBugReport(input, appState)
      } catch {
        setStatus('error')
        setError('Something went wrong. Please try again.')
        return
      }

      if (result.ok) {
        setStatus('success')
        setCooldownActive(true)

        if (cooldownTimer.current) {
          clearTimeout(cooldownTimer.current)
        }
        cooldownTimer.current = setTimeout(() => {
          setCooldownActive(false)
        }, CLIENT_COOLDOWN_MS)
      } else {
        setStatus('error')
        setError(result.error)
      }
    },
    [cooldownActive],
  )

  const reset = useCallback((): void => {
    setStatus('idle')
    setError(null)
  }, [])

  return { status, error, cooldownActive, submit, reset }
}
