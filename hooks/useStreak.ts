// ─────────────────────────────────────────────
// File: hooks/useStreak.ts
// Purpose: Loads practice summary for signed-in users, derives
//          streak state and calendar heatmap data via engine pure
//          functions. Uses the profile timezone (same as the server
//          RPC) to derive "today" consistently. Returns empty data
//          for guests.
// Depends on: services/streak.service.ts, engine/streak.ts,
//             hooks/useAuth.ts, stores/user.store.ts
// ─────────────────────────────────────────────

import { useEffect, useMemo, useState } from 'react'
import { loadPracticeSummary } from '@/services/streak.service'
import type { PracticeDaySummary } from '@/services/streak.service'
import { deriveStreakState, getCalendarDays } from '@/engine/streak'
import { BASE_DISTANCE_INCREMENT, FLAME_DISTANCE_THRESHOLD } from '@/engine/constants'
import type { HeatmapDay } from '@/types/dashboard.types'
import { useAuth } from '@/hooks/useAuth'
import { useUserStore } from '@/stores/user.store'

// ── Types ─────────────────────────────────────

type UseStreakReturn = {
  heatmap: readonly HeatmapDay[]
  streakCount: number
  isLoading: boolean
}

// ── Constants ────────────────────────────────

const LOOKBACK_DAYS = 90
const CALENDAR_WINDOW_DAYS = 42

// ── Helpers ──────────────────────────────────

function getTodayInTimezone(tz: string): string {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date())

    const y = parts.find((p) => p.type === 'year')?.value ?? '2026'
    const m = parts.find((p) => p.type === 'month')?.value ?? '01'
    const d = parts.find((p) => p.type === 'day')?.value ?? '01'
    return `${y}-${m}-${d}`
  } catch {
    const d = new Date()
    const y = d.getFullYear()
    const mo = (d.getMonth() + 1).toString().padStart(2, '0')
    const day = d.getDate().toString().padStart(2, '0')
    return `${y}-${mo}-${day}`
  }
}

function getSinceDate(today: string, days: number): string {
  const [y, m, d] = today.split('-').map(Number)
  const dt = new Date(y, m - 1, d - days)
  const ry = dt.getFullYear()
  const rm = (dt.getMonth() + 1).toString().padStart(2, '0')
  const rd = dt.getDate().toString().padStart(2, '0')
  return `${ry}-${rm}-${rd}`
}

function buildHeatmap(summary: PracticeDaySummary[], today: string): readonly HeatmapDay[] {
  const practiceDates = summary.map((s) => s.date)
  const countMap = new Map(summary.map((s) => [s.date, s.count]))
  const calendarDays = getCalendarDays(practiceDates, today, CALENDAR_WINDOW_DAYS)
  const streakState = deriveStreakState(practiceDates, today)

  return calendarDays.map((cd) => {
    const count = countMap.get(cd.localDate) ?? 0
    const meetsThreshold = count * BASE_DISTANCE_INCREMENT >= FLAME_DISTANCE_THRESHOLD

    let streakFlame: 'red' | 'blue' | null = null
    if (meetsThreshold) {
      streakFlame = 'red'
    } else if (streakState.streakDays.has(cd.localDate) && !cd.practiced) {
      streakFlame = 'blue'
    }

    return {
      date: cd.localDate,
      charactersPracticed: count,
      streakFlame,
    }
  })
}

// ── Hook ─────────────────────────────────────

const EMPTY_HEATMAP: readonly HeatmapDay[] = []

export function useStreak(): UseStreakReturn {
  const { isGuest, isAuthenticated } = useAuth()
  const userId = useUserStore((s) => s.profile?.id)
  const userTz = useUserStore((s) => s.profile?.userTz)
  const [summary, setSummary] = useState<PracticeDaySummary[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const today = useMemo(() => getTodayInTimezone(userTz ?? 'UTC'), [userTz])

  useEffect(() => {
    if (isGuest || !isAuthenticated || !userId) {
      setIsLoading(false)
      return
    }

    let mounted = true
    setIsLoading(true)

    const since = getSinceDate(today, LOOKBACK_DAYS)

    void loadPracticeSummary(userId, since).then((result) => {
      if (!mounted) return
      if (result.ok) {
        setSummary(result.data)
      }
      setIsLoading(false)
    })

    return (): void => {
      mounted = false
    }
  }, [isGuest, isAuthenticated, userId, today])

  const heatmap = useMemo((): readonly HeatmapDay[] => {
    if (!summary) return EMPTY_HEATMAP
    return buildHeatmap(summary, today)
  }, [summary, today])

  const streakCount = useMemo((): number => {
    if (!summary) return 0
    const practiceDates = summary.map((s) => s.date)
    const state = deriveStreakState(practiceDates, today)
    return state.currentStreak
  }, [summary, today])

  return { heatmap, streakCount, isLoading }
}
