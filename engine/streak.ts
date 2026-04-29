// ------------------------------------------------------------
// File: engine/streak.ts
// Purpose: Streak derivation from practice session dates.
//          3-day start rule, grace-day mechanic, calendar rendering.
//          Pure functions only. No side effects.
// Depends on: engine/constants.ts
// ------------------------------------------------------------

import { STREAK_START_THRESHOLD } from '@/engine/constants'

// ── Types ────────────────────────────────────

export type DayStatus = 'practiced' | 'grace' | 'missed' | 'pre-streak'

export type StreakState = {
  currentStreak: number
  practiceDaysInStreak: number
  todayStatus: 'active' | 'pending' | 'broken'
  isStreakStarted: boolean
  streakDays: Set<string>
  preStreakDays: Set<string>
}

export type CalendarDay = {
  localDate: string
  practiced: boolean
  status: DayStatus
}

// ── Date helpers (UTC-safe, no native parse) ─

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

function isValidDate(d: string): boolean {
  return DATE_REGEX.test(d)
}

function parseParts(d: string): { y: number; m: number; day: number } {
  const [y, m, day] = d.split('-').map(Number)
  return { y, m, day }
}

function addDays(date: string, offset: number): string {
  const { y, m, day } = parseParts(date)
  const dt = new Date(Date.UTC(y, m - 1, day + offset))
  const ry = dt.getUTCFullYear()
  const rm = (dt.getUTCMonth() + 1).toString().padStart(2, '0')
  const rd = dt.getUTCDate().toString().padStart(2, '0')
  return `${ry}-${rm}-${rd}`
}

function previousDay(date: string): string {
  return addDays(date, -1)
}

// ── Chain entry ──────────────────────────────

type ChainEntry = { date: string; practiced: boolean }

// ── Main exports ─────────────────────────────

export function deriveStreakState(practiceDates: string[], today: string): StreakState {
  const valid = practiceDates.filter((d) => isValidDate(d) && d <= today)
  const practiceSet = new Set(valid)

  const streakDays = new Set<string>()
  const preStreakDays = new Set<string>()
  const practicedToday = practiceSet.has(today)

  // Determine chain start. If not practiced today, chain can start from
  // yesterday (pending state). If yesterday also not practiced, broken.
  let startDay: string
  if (practicedToday) {
    startDay = today
  } else {
    const yesterday = previousDay(today)
    if (practiceSet.has(yesterday)) {
      startDay = yesterday
    } else {
      return {
        currentStreak: 0,
        practiceDaysInStreak: 0,
        todayStatus: 'broken',
        isStreakStarted: false,
        streakDays,
        preStreakDays,
      }
    }
  }

  // Build raw chain backwards from startDay. Include practiced days and
  // single-day gaps where a practiced day exists on the far side.
  const chain: ChainEntry[] = []
  let cursor = startDay

  while (true) {
    if (practiceSet.has(cursor)) {
      chain.push({ date: cursor, practiced: true })
      cursor = previousDay(cursor)
    } else {
      const behind = previousDay(cursor)
      if (practiceSet.has(behind)) {
        chain.push({ date: cursor, practiced: false })
        cursor = behind
      } else {
        break
      }
    }
  }

  chain.reverse()

  // Find 3-day threshold: first run of STREAK_START_THRESHOLD consecutive
  // practice entries in the chain.
  let thresholdEndIdx = -1
  let run = 0
  for (let i = 0; i < chain.length; i++) {
    if (chain[i].practiced) {
      run++
      if (run >= STREAK_START_THRESHOLD) {
        thresholdEndIdx = i
        break
      }
    } else {
      run = 0
    }
  }

  if (thresholdEndIdx === -1) {
    for (const entry of chain) {
      if (entry.practiced) preStreakDays.add(entry.date)
    }
    return {
      currentStreak: 0,
      practiceDaysInStreak: 0,
      todayStatus: practicedToday ? 'active' : 'pending',
      isStreakStarted: false,
      streakDays,
      preStreakDays,
    }
  }

  // Streak started. Build from the threshold run start.
  const thresholdStartIdx = thresholdEndIdx - STREAK_START_THRESHOLD + 1

  for (let i = 0; i < thresholdStartIdx; i++) {
    if (chain[i].practiced) preStreakDays.add(chain[i].date)
  }

  let streakLength = 0
  let practiceDaysCount = 0
  let graceAvailable = true
  let lastWasGrace = false

  for (let i = thresholdStartIdx; i < chain.length; i++) {
    const entry = chain[i]
    if (entry.practiced) {
      streakLength++
      practiceDaysCount++
      streakDays.add(entry.date)
      graceAvailable = true
      lastWasGrace = false
    } else if (graceAvailable && !lastWasGrace) {
      streakLength++
      streakDays.add(entry.date)
      graceAvailable = false
      lastWasGrace = true
    } else {
      break
    }
  }

  return {
    currentStreak: streakLength,
    practiceDaysInStreak: practiceDaysCount,
    todayStatus: practicedToday ? 'active' : 'pending',
    isStreakStarted: true,
    streakDays,
    preStreakDays,
  }
}

// Generates calendar day entries for rendering.
export function getCalendarDays(
  practiceDates: string[],
  today: string,
  windowDays: number = 35,
): CalendarDay[] {
  const streakState = deriveStreakState(practiceDates, today)
  const practiceSet = new Set(practiceDates.filter((d) => isValidDate(d)))
  const days: CalendarDay[] = []

  for (let i = windowDays - 1; i >= 0; i--) {
    const date = addDays(today, -i)
    const practiced = practiceSet.has(date)
    let status: DayStatus

    if (streakState.streakDays.has(date)) {
      status = practiced ? 'practiced' : 'grace'
    } else if (streakState.preStreakDays.has(date)) {
      status = 'pre-streak'
    } else if (practiced) {
      status = 'practiced'
    } else {
      status = 'missed'
    }

    days.push({ localDate: date, practiced, status })
  }

  return days
}
