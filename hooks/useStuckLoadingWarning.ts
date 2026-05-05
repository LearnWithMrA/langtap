// ─────────────────────────────────────────────
// File: hooks/useStuckLoadingWarning.ts
// Purpose: Dev-only watchdog that warns when async render gates
//          stay true beyond a threshold. Catches the class of bug
//          where Strict Mode double-fire leaves isLoading stuck.
//          No-op in production builds.
// Depends on: react
// ─────────────────────────────────────────────

'use client'

import { useEffect, useRef } from 'react'

// ── Constants ─────────────────────────────────

const STUCK_THRESHOLD_MS = 5000

// ── Hook ──────────────────────────────────────

export function useStuckLoadingWarning(flags: Record<string, boolean>, context: string): void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const flagsRef = useRef(flags)
  flagsRef.current = flags

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return

    const stuckFlags = Object.entries(flags).filter(([, v]) => v)
    if (stuckFlags.length === 0) {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      return
    }

    if (timerRef.current) return

    timerRef.current = setTimeout(() => {
      const stillStuck = Object.entries(flagsRef.current).filter(([, v]) => v)
      if (stillStuck.length > 0) {
        const names = stillStuck.map(([k]) => k).join(', ')
        // eslint-disable-next-line no-console
        console.warn(
          `[LangTap] Stuck loading gate in ${context}: ${names} has been true for ${STUCK_THRESHOLD_MS / 1000}s. ` +
            'This usually means an async init effect was cleaned up before completing. ' +
            'Check that markInitialized/setLoading are called only after async work finishes.',
        )
      }
      timerRef.current = null
    }, STUCK_THRESHOLD_MS)

    return (): void => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [flags, context])
}
