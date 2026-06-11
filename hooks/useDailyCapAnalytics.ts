// ─────────────────────────────────────────────
// File: hooks/useDailyCapAnalytics.ts
// Purpose: Observes the daily-cap store and fires the daily_cap_hit
//          analytics event when isCapped transitions from false to
//          true. Lives in a hook (not the store) because stores must
//          never import services (docs/ARCHITECTURE.md). Fires at most
//          once per calendar day per browser via a localStorage flag.
// Depends on: stores/daily-cap.store.ts, services/analytics.service.ts
// ─────────────────────────────────────────────

import { useEffect, useRef } from 'react'
import { useDailyCapStore } from '@/stores/daily-cap.store'
import { trackEvent, ANALYTICS_EVENTS } from '@/services/analytics.service'

// ── Constants ─────────────────────────────────

const SENT_KEY = 'langtap-analytics-daily-cap-hit'

// ── Hook ──────────────────────────────────────

export function useDailyCapAnalytics(): void {
  const isCapped = useDailyCapStore((s) => s.capState?.isCapped ?? false)
  const previousRef = useRef(isCapped)

  useEffect(() => {
    const wasCapped = previousRef.current
    previousRef.current = isCapped
    if (wasCapped || !isCapped) return

    try {
      const today = new Date().toISOString().slice(0, 10)
      if (localStorage.getItem(SENT_KEY) === today) return
      localStorage.setItem(SENT_KEY, today)
    } catch {
      // localStorage unavailable: still send, transition guard above
      // prevents repeats within this mount.
    }
    trackEvent(ANALYTICS_EVENTS.DAILY_CAP_HIT)
  }, [isCapped])
}
