// ─────────────────────────────────────────────
// File: samples/dashboard-fixtures.ts
// Purpose: Mock dashboard data for the Game Home visual shell.
//          Covers streak state, heatmap calendar, stage progress,
//          stats, and leaderboard position. Three presets:
//            - ZERO: brand new user, no activity
//            - MID: active user with partial progress
//            - ADVANCED: high-progress user near completion
//          Used while the real stores (Sprint 4+) and Supabase
//          persistence are not yet wired up.
// Depends on: none (self-contained mock data)
// ─────────────────────────────────────────────

// ── Types ─────────────────────────────────────

export type StreakState = {
  readonly streakChainDays: number
  readonly practiceDays: number
  readonly todayState: 'active' | 'grace' | 'broken'
}

export type HeatmapDay = {
  readonly date: string
  readonly charactersPracticed: number
  readonly streakFlame: 'red' | 'blue' | null
}

export type StageProgress = {
  readonly label: string
  readonly mastered: number
  readonly total: number
  readonly percentage: number
}

export type DashboardStats = {
  readonly totalScore: number
  readonly unlockedCount: number
  readonly totalCharacters: number
  readonly lastPracticed: string | null
  readonly distanceMetres: number
}

export type LeaderboardGlance = {
  readonly rank: number | null
  readonly username: string
  readonly score: number
}

export type DashboardFixture = {
  readonly streak: StreakState
  readonly heatmap: readonly HeatmapDay[]
  readonly stages: readonly StageProgress[]
  readonly kotobaStages: readonly StageProgress[]
  readonly stats: DashboardStats
  readonly leaderboard: LeaderboardGlance
  readonly kotobaLeaderboard: LeaderboardGlance
  readonly kotobaLocked: boolean
  readonly inputMode: 'tap' | 'type' | 'swipe'
}

export type DashboardFixtureKey = 'zero' | 'mid' | 'advanced'

// ── Helpers ───────────────────────────────────

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

function buildHeatmap(daysBack: number, practiceMap: (daysAgo: number) => number): HeatmapDay[] {
  const raw: { date: string; chars: number }[] = []
  for (let i = daysBack; i >= 0; i--) {
    raw.push({ date: daysAgo(i), chars: practiceMap(i) })
  }

  const days: HeatmapDay[] = raw.map((d) => ({
    date: d.date,
    charactersPracticed: d.chars,
    streakFlame: null,
  }))

  // Walk forward through days to assign streaks and flames.
  // Rules:
  //   - 3+ consecutive active days starts a streak
  //   - Once in a streak, missing 1 day = saved (blue flame), streak continues
  //   - After a saved day, must have 1 active day before another save is allowed
  //   - Missing 2 in a row, or missing after a save without an active day between = streak broken
  let consecutiveActive = 0
  let inStreak = false
  let canSave = true

  for (let i = 0; i < days.length; i++) {
    const practiced = days[i].charactersPracticed > 0

    if (practiced) {
      consecutiveActive++
      if (!inStreak && consecutiveActive >= 3) {
        inStreak = true
        for (let j = i - consecutiveActive + 1; j <= i; j++) {
          days[j] = { ...days[j], streakFlame: 'red' }
        }
      } else if (inStreak) {
        days[i] = { ...days[i], streakFlame: 'red' }
        canSave = true
      }
    } else {
      if (inStreak && canSave) {
        days[i] = { ...days[i], streakFlame: 'blue' }
        canSave = false
        consecutiveActive = 0
      } else {
        inStreak = false
        consecutiveActive = 0
        canSave = true
      }
    }
  }

  return days
}

function computeStreak(heatmap: readonly HeatmapDay[]): StreakState {
  let chainDays = 0
  let practiceDays = 0
  let todayState: 'active' | 'grace' | 'broken' = 'broken'

  for (let i = heatmap.length - 1; i >= 0; i--) {
    const flame = heatmap[i].streakFlame
    if (flame === 'red') {
      chainDays++
      practiceDays++
      if (i === heatmap.length - 1) todayState = 'active'
    } else if (flame === 'blue') {
      chainDays++
      if (i === heatmap.length - 1) todayState = 'grace'
    } else {
      break
    }
  }

  return { streakChainDays: chainDays, practiceDays, todayState }
}

// ── Fixture builder ───────────────────────────

function buildFixture(
  practiceMap: (daysAgo: number) => number,
  rest: Omit<DashboardFixture, 'streak' | 'heatmap'>,
): DashboardFixture {
  const heatmap = buildHeatmap(30, practiceMap)
  const streak = computeStreak(heatmap)
  return { streak, heatmap, ...rest }
}

// ── Fixtures ──────────────────────────────────

// Zero: brand new user, no activity at all.
const ZERO_FIXTURE = buildFixture(() => 0, {
  stages: [
    { label: 'Seion', mastered: 0, total: 92, percentage: 0 },
    { label: 'Dakuon', mastered: 0, total: 50, percentage: 0 },
    { label: 'Yoon', mastered: 0, total: 66, percentage: 0 },
  ],
  kotobaStages: [
    { label: 'N5', mastered: 0, total: 600, percentage: 0 },
    { label: 'N4', mastered: 0, total: 500, percentage: 0 },
    { label: 'N3', mastered: 0, total: 650, percentage: 0 },
  ],
  stats: {
    totalScore: 0,
    unlockedCount: 0,
    totalCharacters: 208,
    lastPracticed: null,
    distanceMetres: 0,
  },
  leaderboard: { rank: null, username: 'user_a1b2c3d4', score: 0 },
  kotobaLeaderboard: { rank: null, username: 'user_a1b2c3d4', score: 0 },
  kotobaLocked: true,
  inputMode: 'tap',
})

// Mid: current streak with two saves, plus a past streak earlier in the month.
// Days ago (0 = today):
//   0-3: active  (current streak continues)
//   4:   missed  (saved)
//   5-6: active  (re-enables save)
//   7:   missed  (saved)
//   8-10: active (streak started here, 3 consecutive)
//   11-14: missed (streak broken, gap)
//   15-17: active (past streak, 3 days)
//   18+: scattered or nothing
const MID_FIXTURE = buildFixture(
  (i) => {
    if (i <= 3) return 30 + ((i * 17) % 50)
    if (i === 4) return 0
    if (i <= 6) return 35 + ((i * 11) % 30)
    if (i === 7) return 0
    if (i <= 10) return 20 + ((i * 13) % 40)
    if (i <= 14) return 0
    if (i <= 17) return 25
    if (i === 22 || i === 23) return 15
    return 0
  },
  {
    stages: [
      { label: 'Seion', mastered: 38, total: 92, percentage: 41 },
      { label: 'Dakuon', mastered: 4, total: 50, percentage: 8 },
      { label: 'Yoon', mastered: 0, total: 66, percentage: 0 },
    ],
    kotobaStages: [
      { label: 'N5', mastered: 87, total: 600, percentage: 15 },
      { label: 'N4', mastered: 12, total: 500, percentage: 2 },
      { label: 'N3', mastered: 0, total: 650, percentage: 0 },
    ],
    stats: {
      totalScore: 1247,
      unlockedCount: 46,
      totalCharacters: 208,
      lastPracticed: '2026-04-24T08:00:00.000Z',
      distanceMetres: 2437,
    },
    leaderboard: { rank: 42, username: 'tanuki42', score: 1247 },
    kotobaLeaderboard: { rank: 78, username: 'tanuki42', score: 99 },
    kotobaLocked: false,
    inputMode: 'tap',
  },
)

// Advanced: nearly the whole month active with two save days.
// Days ago:
//   0-9: active
//   10:  missed (saved)
//   11-19: active (re-enables save)
//   20:  missed (saved)
//   21-30: active
const ADVANCED_FIXTURE = buildFixture(
  (i) => {
    if (i === 10 || i === 20) return 0
    return 40 + ((i * 19) % 60)
  },
  {
    stages: [
      { label: 'Seion', mastered: 88, total: 92, percentage: 96 },
      { label: 'Dakuon', mastered: 42, total: 50, percentage: 84 },
      { label: 'Yoon', mastered: 51, total: 66, percentage: 77 },
    ],
    kotobaStages: [
      { label: 'N5', mastered: 412, total: 600, percentage: 69 },
      { label: 'N4', mastered: 198, total: 500, percentage: 40 },
      { label: 'N3', mastered: 45, total: 650, percentage: 7 },
    ],
    stats: {
      totalScore: 8943,
      unlockedCount: 198,
      totalCharacters: 208,
      lastPracticed: '2026-04-24T10:30:00.000Z',
      distanceMetres: 18720,
    },
    leaderboard: { rank: 3, username: 'kana_master', score: 8943 },
    kotobaLeaderboard: { rank: 11, username: 'kana_master', score: 655 },
    kotobaLocked: false,
    inputMode: 'type',
  },
)

const FIXTURES: Record<DashboardFixtureKey, DashboardFixture> = {
  zero: ZERO_FIXTURE,
  mid: MID_FIXTURE,
  advanced: ADVANCED_FIXTURE,
}

export function getDashboardFixture(key: DashboardFixtureKey): DashboardFixture {
  return FIXTURES[key]
}
