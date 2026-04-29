// ─────────────────────────────────────────────
// File: types/dashboard.types.ts
// Purpose: Domain types for the game home dashboard.
// Depends on: nothing
// ─────────────────────────────────────────────

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

export type LeaderboardGlance = {
  readonly rank: number | null
  readonly username: string
  readonly score: number
}

export type DashboardStats = {
  readonly totalScore: number
  readonly unlockedCount: number
  readonly totalCharacters: number
  readonly lastPracticed: string | null
  readonly distanceMetres: number
}

export type StreakState = {
  readonly streakChainDays: number
  readonly practiceDays: number
  readonly todayState: 'active' | 'grace' | 'broken'
}
