// ------------------------------------------------------------
// File: engine/__tests__/streak.test.ts
// Purpose: Tests for streak derivation, calendar rendering,
//          3-day start rule, and grace day mechanic.
// Depends on: engine/streak.ts
// ------------------------------------------------------------

import { describe, it, expect } from 'vitest'
import { deriveStreakState, getCalendarDays } from '@/engine/streak'
import type { StreakState } from '@/engine/streak'

// ── Helpers ──────────────────────────────────

function dates(...ds: string[]): string[] {
  return ds
}

function expectStreak(state: StreakState, expected: Partial<StreakState>): void {
  if (expected.currentStreak !== undefined) {
    expect(state.currentStreak).toBe(expected.currentStreak)
  }
  if (expected.practiceDaysInStreak !== undefined) {
    expect(state.practiceDaysInStreak).toBe(expected.practiceDaysInStreak)
  }
  if (expected.todayStatus !== undefined) {
    expect(state.todayStatus).toBe(expected.todayStatus)
  }
  if (expected.isStreakStarted !== undefined) {
    expect(state.isStreakStarted).toBe(expected.isStreakStarted)
  }
}

// ── deriveStreakState ─────────────────────────

describe('deriveStreakState', () => {
  describe('no practice history', () => {
    it('returns streak 0, not started, today broken', () => {
      const state = deriveStreakState([], '2026-04-29')
      expectStreak(state, {
        currentStreak: 0,
        practiceDaysInStreak: 0,
        todayStatus: 'broken',
        isStreakStarted: false,
      })
    })
  })

  describe('3-day start rule', () => {
    it('returns streak 0 after 1 day of practice', () => {
      const state = deriveStreakState(dates('2026-04-29'), '2026-04-29')
      expectStreak(state, {
        currentStreak: 0,
        isStreakStarted: false,
        todayStatus: 'active',
      })
    })

    it('returns streak 0 after 2 consecutive days', () => {
      const state = deriveStreakState(dates('2026-04-28', '2026-04-29'), '2026-04-29')
      expectStreak(state, {
        currentStreak: 0,
        isStreakStarted: false,
        todayStatus: 'active',
      })
    })

    it('returns streak 3 after 3 consecutive days ending today', () => {
      const state = deriveStreakState(dates('2026-04-27', '2026-04-28', '2026-04-29'), '2026-04-29')
      expectStreak(state, {
        currentStreak: 3,
        practiceDaysInStreak: 3,
        todayStatus: 'active',
        isStreakStarted: true,
      })
    })

    it('no grace before streak starts: 2 days, skip, 1 day = no streak', () => {
      const state = deriveStreakState(dates('2026-04-26', '2026-04-27', '2026-04-29'), '2026-04-29')
      expectStreak(state, {
        currentStreak: 0,
        isStreakStarted: false,
      })
    })
  })

  describe('basic streak', () => {
    it('returns streak 5 after 5 consecutive days', () => {
      const state = deriveStreakState(
        dates('2026-04-25', '2026-04-26', '2026-04-27', '2026-04-28', '2026-04-29'),
        '2026-04-29',
      )
      expectStreak(state, {
        currentStreak: 5,
        practiceDaysInStreak: 5,
        todayStatus: 'active',
        isStreakStarted: true,
      })
    })

    it('returns todayStatus active when practiced today', () => {
      const state = deriveStreakState(dates('2026-04-27', '2026-04-28', '2026-04-29'), '2026-04-29')
      expect(state.todayStatus).toBe('active')
    })
  })

  describe('grace day', () => {
    it('preserves streak when one day is missed after threshold', () => {
      // Days 25-27 build streak (3), day 28 missed (grace), day 29 practiced
      const state = deriveStreakState(
        dates('2026-04-25', '2026-04-26', '2026-04-27', '2026-04-29'),
        '2026-04-29',
      )
      expectStreak(state, {
        currentStreak: 5,
        practiceDaysInStreak: 4,
        isStreakStarted: true,
        todayStatus: 'active',
      })
    })

    it('breaks streak when two consecutive days are missed', () => {
      // Days 25-27 streak, days 28-29 missed
      const state = deriveStreakState(dates('2026-04-25', '2026-04-26', '2026-04-27'), '2026-04-29')
      expectStreak(state, {
        currentStreak: 0,
        todayStatus: 'broken',
        isStreakStarted: false,
      })
    })

    it('breaks streak when day after grace is also missed', () => {
      // Days 24-26 streak (3), day 27 grace, day 28 missed = broken
      const state = deriveStreakState(dates('2026-04-24', '2026-04-25', '2026-04-26'), '2026-04-29')
      expectStreak(state, {
        currentStreak: 0,
        todayStatus: 'broken',
      })
    })

    it('re-enables grace after practicing on the day after a grace day', () => {
      // Days 24-26 streak (3), day 27 grace, day 28 practiced (grace re-enabled),
      // day 29 practiced
      const state = deriveStreakState(
        dates('2026-04-24', '2026-04-25', '2026-04-26', '2026-04-28', '2026-04-29'),
        '2026-04-29',
      )
      expectStreak(state, {
        currentStreak: 6,
        practiceDaysInStreak: 5,
        isStreakStarted: true,
      })
    })

    it('allows multiple grace days separated by practice days', () => {
      // 23,24,25 (streak 3), skip 26 (grace), 27 (practice), skip 28 (grace), 29 (practice)
      const state = deriveStreakState(
        dates('2026-04-23', '2026-04-24', '2026-04-25', '2026-04-27', '2026-04-29'),
        '2026-04-29',
      )
      expectStreak(state, {
        currentStreak: 7,
        practiceDaysInStreak: 5,
        isStreakStarted: true,
      })
    })
  })

  describe('grace day state machine', () => {
    it('ACTIVE + no practice = GRACE (preserves streak)', () => {
      // 26,27,28 streak, 29 not practiced yet (pending)
      const state = deriveStreakState(dates('2026-04-26', '2026-04-27', '2026-04-28'), '2026-04-29')
      expect(state.todayStatus).toBe('pending')
      expect(state.currentStreak).toBe(3)
    })

    it('GRACE + no practice = BROKEN', () => {
      // 25,26,27 streak (3), 28 grace, 29 not practiced
      // But 28 is grace only if 29 was going to practice. Since 29 didnt, 28 is grace and 29 breaks.
      // Actually: 25,26,27 practiced. 28 not practiced. 29 not practiced.
      // Walk from 29 back: 29 not practiced, 28 not practiced = two misses = broken.
      const state = deriveStreakState(dates('2026-04-25', '2026-04-26', '2026-04-27'), '2026-04-29')
      expectStreak(state, {
        currentStreak: 0,
        todayStatus: 'broken',
      })
    })
  })

  describe('today status', () => {
    it('returns pending when not practiced today but yesterday was active', () => {
      const state = deriveStreakState(dates('2026-04-27', '2026-04-28', '2026-04-29'), '2026-04-30')
      expect(state.todayStatus).toBe('pending')
      expect(state.currentStreak).toBe(3)
    })

    it('returns broken when streak was already broken', () => {
      const state = deriveStreakState(dates('2026-04-25'), '2026-04-29')
      expect(state.todayStatus).toBe('broken')
    })
  })

  describe('edge cases', () => {
    it('handles duplicate dates in input', () => {
      const state = deriveStreakState(
        dates('2026-04-27', '2026-04-27', '2026-04-28', '2026-04-29'),
        '2026-04-29',
      )
      expectStreak(state, { currentStreak: 3, isStreakStarted: true })
    })

    it('handles unsorted dates in input', () => {
      const state = deriveStreakState(dates('2026-04-29', '2026-04-27', '2026-04-28'), '2026-04-29')
      expectStreak(state, { currentStreak: 3, isStreakStarted: true })
    })

    it('handles a very long streak (30 days)', () => {
      const ds: string[] = []
      const base = new Date(Date.UTC(2026, 3, 29))
      for (let i = 0; i < 30; i++) {
        const d = new Date(base.getTime() - i * 86400000)
        const y = d.getUTCFullYear()
        const m = (d.getUTCMonth() + 1).toString().padStart(2, '0')
        const day = d.getUTCDate().toString().padStart(2, '0')
        ds.push(`${y}-${m}-${day}`)
      }
      const state = deriveStreakState(ds, '2026-04-29')
      expect(state.currentStreak).toBe(30)
      expect(state.practiceDaysInStreak).toBe(30)
    })

    it('handles returning after a 30-day gap', () => {
      const state = deriveStreakState(
        dates('2026-03-01', '2026-03-02', '2026-03-03', '2026-04-29'),
        '2026-04-29',
      )
      expectStreak(state, {
        currentStreak: 0,
        isStreakStarted: false,
      })
    })

    it('handles single practice day that is not today', () => {
      const state = deriveStreakState(dates('2026-04-28'), '2026-04-29')
      expectStreak(state, {
        currentStreak: 0,
        todayStatus: 'pending',
        isStreakStarted: false,
      })
    })

    it('ignores future dates', () => {
      const state = deriveStreakState(
        dates('2026-04-27', '2026-04-28', '2026-04-29', '2026-04-30', '2026-05-01'),
        '2026-04-29',
      )
      expectStreak(state, { currentStreak: 3, practiceDaysInStreak: 3 })
    })

    it('ignores malformed date strings', () => {
      const state = deriveStreakState(
        dates('2026-04-27', 'not-a-date', '2026-04-28', '', '2026-04-29'),
        '2026-04-29',
      )
      expectStreak(state, { currentStreak: 3, isStreakStarted: true })
    })

    it('streak of exactly 3, then grace, then practice = streak 5', () => {
      const state = deriveStreakState(
        dates('2026-04-25', '2026-04-26', '2026-04-27', '2026-04-29'),
        '2026-04-29',
      )
      expectStreak(state, {
        currentStreak: 5,
        practiceDaysInStreak: 4,
        isStreakStarted: true,
      })
    })

    it('month boundary: practice spans March to April', () => {
      const state = deriveStreakState(dates('2026-03-30', '2026-03-31', '2026-04-01'), '2026-04-01')
      expectStreak(state, { currentStreak: 3, isStreakStarted: true })
    })

    it('year boundary: practice spans December to January', () => {
      const state = deriveStreakState(dates('2025-12-30', '2025-12-31', '2026-01-01'), '2026-01-01')
      expectStreak(state, { currentStreak: 3, isStreakStarted: true })
    })
  })
})

// ── getCalendarDays ──────────────────────────

describe('getCalendarDays', () => {
  it('returns 35 days by default ending at today', () => {
    const days = getCalendarDays([], '2026-04-29')
    expect(days).toHaveLength(35)
    expect(days[days.length - 1].localDate).toBe('2026-04-29')
  })

  it('returns custom window size', () => {
    const days = getCalendarDays([], '2026-04-29', 7)
    expect(days).toHaveLength(7)
  })

  it('first day is the oldest, last is today', () => {
    const days = getCalendarDays([], '2026-04-29', 5)
    expect(days[0].localDate).toBe('2026-04-25')
    expect(days[4].localDate).toBe('2026-04-29')
  })

  it('marks practiced days correctly', () => {
    const days = getCalendarDays(dates('2026-04-28', '2026-04-29'), '2026-04-29', 3)
    expect(days[0].practiced).toBe(false)
    expect(days[1].practiced).toBe(true)
    expect(days[2].practiced).toBe(true)
  })

  it('marks streak days as practiced status', () => {
    const days = getCalendarDays(dates('2026-04-27', '2026-04-28', '2026-04-29'), '2026-04-29', 5)
    const apr27 = days.find((d) => d.localDate === '2026-04-27')!
    const apr28 = days.find((d) => d.localDate === '2026-04-28')!
    const apr29 = days.find((d) => d.localDate === '2026-04-29')!
    expect(apr27.status).toBe('practiced')
    expect(apr28.status).toBe('practiced')
    expect(apr29.status).toBe('practiced')
  })

  it('marks grace days with grace status', () => {
    // 25,26,27 streak, skip 28 (grace), 29 practice
    const days = getCalendarDays(
      dates('2026-04-25', '2026-04-26', '2026-04-27', '2026-04-29'),
      '2026-04-29',
      7,
    )
    const apr28 = days.find((d) => d.localDate === '2026-04-28')!
    expect(apr28.status).toBe('grace')
    expect(apr28.practiced).toBe(false)
  })

  it('marks pre-streak days correctly', () => {
    // Only 2 days practiced (not enough for streak start)
    const days = getCalendarDays(dates('2026-04-28', '2026-04-29'), '2026-04-29', 5)
    const apr28 = days.find((d) => d.localDate === '2026-04-28')!
    const apr29 = days.find((d) => d.localDate === '2026-04-29')!
    expect(apr28.status).toBe('pre-streak')
    expect(apr29.status).toBe('pre-streak')
  })

  it('windowDays=1 returns only today', () => {
    const days = getCalendarDays(dates('2026-04-29'), '2026-04-29', 1)
    expect(days).toHaveLength(1)
    expect(days[0].localDate).toBe('2026-04-29')
  })
})
