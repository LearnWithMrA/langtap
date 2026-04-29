// ─────────────────────────────────────────────
// File: types/leaderboard.types.ts
// Purpose: Domain types for the leaderboard feature.
// Depends on: nothing
// ─────────────────────────────────────────────

export type LeaderboardEntry = {
  readonly rank: number
  readonly username: string
  readonly score: number
  readonly isCurrentUser: boolean
}

export type LeaderboardBoard = {
  readonly entries: readonly LeaderboardEntry[]
  readonly currentUserPinned: LeaderboardEntry | null
}

export type TimePeriod = 'all-time' | 'this-week'
export type GameType = 'kana' | 'kotoba'
