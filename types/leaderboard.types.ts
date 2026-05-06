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

// ── Attempt types ───────────────────────────

export type LeaderboardAttemptEntry = {
  readonly charIndex: number
  readonly submitted: string
}

export type PendingSession = {
  wordId: string
  sessionId: string | null
  pendingAttempts: LeaderboardAttemptEntry[] | null
}

// ── Server row types ─────────────────────────

export type LeaderboardScoreRow = {
  readonly id: number
  readonly userId: string
  readonly gameType: GameType
  readonly inputMode: 'tap' | 'type' | 'swipe'
  readonly totalScore: number
  readonly weekScore: number
  readonly weekStart: string
  readonly updatedAt: string
}

export type LeaderboardScoreEvent = {
  readonly eventId: string
  readonly userId: string
  readonly gameType: GameType
  readonly inputMode: 'tap' | 'type' | 'swipe'
  readonly scoreDelta: number
  readonly createdAt: string
}
