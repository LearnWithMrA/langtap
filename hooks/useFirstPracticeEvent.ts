// ─────────────────────────────────────────────
// File: hooks/useFirstPracticeEvent.ts
// Purpose: Fires the first_practice analytics event exactly once per
//          user (localStorage flag, user-scoped). Called from the
//          practice client on prompt completion; subsequent calls are
//          no-ops, so the Vercel event budget is not consumed by
//          every completion.
// Depends on: services/analytics.service.ts, stores/scoped-storage.ts
// ─────────────────────────────────────────────

import { useCallback } from 'react'
import { trackEvent, ANALYTICS_EVENTS } from '@/services/analytics.service'
import { getStorageUserId } from '@/stores/scoped-storage'

// ── Constants ─────────────────────────────────

const BASE_KEY = 'langtap-analytics-first-practice'

function currentKey(): string {
  const userId = getStorageUserId()
  return userId ? `${BASE_KEY}-${userId}` : BASE_KEY
}

// ── Hook ──────────────────────────────────────

export function useFirstPracticeEvent(gameType: string): {
  recordFirstPractice: () => void
} {
  const recordFirstPractice = useCallback((): void => {
    try {
      const key = currentKey()
      if (localStorage.getItem(key)) return
      localStorage.setItem(key, new Date().toISOString())
      trackEvent(ANALYTICS_EVENTS.FIRST_PRACTICE, { game_type: gameType })
    } catch {
      // localStorage unavailable (private mode): skip rather than risk
      // sending the event on every completion.
    }
  }, [gameType])

  return { recordFirstPractice }
}
