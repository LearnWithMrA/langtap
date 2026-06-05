// ─────────────────────────────────────────────
// File: hooks/usePracticeActivityTracker.ts
// Purpose: Batches practice completions and flushes to the
//          record_practice_activity RPC. Does NOT call the RPC on
//          every single completion. Flushes on: (a) every 10
//          completions, (b) every 30 seconds if dirty, (c) on
//          visibilitychange to hidden, (d) on unmount (route change).
//          Restores pending count on flush failure.
//          Guests do not record practice activity.
// Depends on: services/practice-session.service.ts
// ─────────────────────────────────────────────

import { useCallback, useEffect, useRef } from 'react'
import { recordPracticeActivity } from '@/services/practice-session.service'

// ── Constants ────────────────────────────────

const FLUSH_THRESHOLD = 10
const FLUSH_INTERVAL_MS = 30_000

// ── Hook ─────────────────────────────────────

export function usePracticeActivityTracker(isGuest: boolean): {
  trackCompletion: (charactersCount: number) => void
  flush: () => Promise<void>
} {
  const pendingCountRef = useRef(0)
  const flushingRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isGuestRef = useRef(isGuest)
  isGuestRef.current = isGuest

  const clearTimer = useCallback((): void => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const doFlush = useCallback(async (): Promise<void> => {
    if (isGuestRef.current || pendingCountRef.current === 0 || flushingRef.current) return
    flushingRef.current = true
    const count = pendingCountRef.current
    pendingCountRef.current = 0
    clearTimer()

    try {
      const result = await recordPracticeActivity(crypto.randomUUID(), count)
      if (!result.ok) {
        pendingCountRef.current += count
      }
    } catch {
      pendingCountRef.current += count
    } finally {
      flushingRef.current = false
    }
  }, [clearTimer])

  const scheduleTimer = useCallback((): void => {
    if (timerRef.current !== null) return
    timerRef.current = setTimeout(() => {
      timerRef.current = null
      void doFlush()
    }, FLUSH_INTERVAL_MS)
  }, [doFlush])

  const trackCompletion = useCallback(
    (charactersCount: number): void => {
      if (isGuestRef.current) return
      pendingCountRef.current += charactersCount
      if (pendingCountRef.current >= FLUSH_THRESHOLD) {
        clearTimer()
        void doFlush()
      } else {
        scheduleTimer()
      }
    },
    [doFlush, clearTimer, scheduleTimer],
  )

  // Flush on visibilitychange to hidden (tab switch, minimize, tab close)
  useEffect(() => {
    if (isGuest) return

    const handleVisibilityChange = (): void => {
      if (document.visibilityState === 'hidden') {
        void doFlush()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return (): void => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isGuest, doFlush])

  // Flush on unmount (route navigation away from practice)
  useEffect(() => {
    if (isGuest) return
    return (): void => {
      clearTimer()
      if (pendingCountRef.current > 0) {
        const count = pendingCountRef.current
        pendingCountRef.current = 0
        void recordPracticeActivity(crypto.randomUUID(), count)
      }
    }
  }, [isGuest, clearTimer])

  return { trackCompletion, flush: doFlush }
}
