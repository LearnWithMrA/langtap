// ─────────────────────────────────────────────
// File: samples/leaderboard-fixtures.ts
// Purpose: Mock leaderboard data for the visual shell.
//          Provides ranked entries for Kana and Kotoba boards
//          across Tap, Type, and Swipe modes. Used until real
//          Supabase data is wired in Sprint 9.
// Depends on: none (self-contained mock data)
// ─────────────────────────────────────────────

// ── Types ─────────────────────────────────────

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

export type InputMode = 'tap' | 'type' | 'swipe'
export type TimePeriod = 'all-time' | 'this-week'
export type GameType = 'kana' | 'kotoba'

// ── Constants ─────────────────────────────────

const AVATAR_COLORS = [
  'bg-sage-300',
  'bg-sky-400',
  'bg-mint-300',
  'bg-blush-300',
  'bg-profile-accent',
  'bg-feedback-wrong',
  'bg-warm-400',
  'bg-heat-3',
] as const

// ── Helpers ───────────────────────────────────

export function getAvatarColor(username: string): string {
  let hash = 0
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export function formatLeaderboardScore(score: number): string {
  if (score >= 10000) return `${(score / 1000).toFixed(1)}k`
  return score.toLocaleString()
}

// ── All Time Kana data ────────────────────────

const KANA_ALL_TIME_ENTRIES: readonly LeaderboardEntry[] = [
  { rank: 1, username: 'sakura_wind', score: 12450, isCurrentUser: false },
  { rank: 2, username: 'tokyodrift', score: 11200, isCurrentUser: false },
  { rank: 3, username: 'kana_queen', score: 9870, isCurrentUser: false },
  { rank: 4, username: 'nihongo_nerd', score: 8340, isCurrentUser: false },
  { rank: 5, username: 'zentyper', score: 7650, isCurrentUser: false },
  { rank: 6, username: 'hiragana_hero', score: 6420, isCurrentUser: false },
  { rank: 7, username: 'matcha_fox', score: 5890, isCurrentUser: false },
  { rank: 8, username: 'ramen_rider', score: 4750, isCurrentUser: false },
  { rank: 9, username: 'mochi_monk', score: 3920, isCurrentUser: false },
  { rank: 10, username: 'fuji_flyer', score: 3100, isCurrentUser: false },
]

const KANA_ALL_TIME_PINNED: LeaderboardEntry = {
  rank: 42,
  username: 'tanuki42',
  score: 1247,
  isCurrentUser: true,
}

// ── This Week Kana data ───────────────────────

const KANA_THIS_WEEK_ENTRIES: readonly LeaderboardEntry[] = [
  { rank: 1, username: 'zentyper', score: 1840, isCurrentUser: false },
  { rank: 2, username: 'nihongo_nerd', score: 1520, isCurrentUser: false },
  { rank: 3, username: 'kana_queen', score: 1390, isCurrentUser: false },
  { rank: 4, username: 'sakura_wind', score: 980, isCurrentUser: false },
  { rank: 5, username: 'matcha_fox', score: 760, isCurrentUser: false },
  { rank: 6, username: 'ramen_rider', score: 540, isCurrentUser: false },
  { rank: 7, username: 'hiragana_hero', score: 480, isCurrentUser: false },
  { rank: 8, username: 'fuji_flyer', score: 320, isCurrentUser: false },
  { rank: 9, username: 'tokyodrift', score: 290, isCurrentUser: false },
  { rank: 10, username: 'mochi_monk', score: 210, isCurrentUser: false },
]

const KANA_THIS_WEEK_PINNED: LeaderboardEntry = {
  rank: 18,
  username: 'tanuki42',
  score: 85,
  isCurrentUser: true,
}

// ── All Time Kotoba data ─────────────────────

const KOTOBA_ALL_TIME_ENTRIES: readonly LeaderboardEntry[] = [
  { rank: 1, username: 'word_wizard', score: 9820, isCurrentUser: false },
  { rank: 2, username: 'kanji_king', score: 8740, isCurrentUser: false },
  { rank: 3, username: 'nihongo_nerd', score: 7650, isCurrentUser: false },
  { rank: 4, username: 'tokyodrift', score: 6380, isCurrentUser: false },
  { rank: 5, username: 'sakura_wind', score: 5920, isCurrentUser: false },
  { rank: 6, username: 'matcha_fox', score: 4810, isCurrentUser: false },
  { rank: 7, username: 'ramen_rider', score: 3670, isCurrentUser: false },
  { rank: 8, username: 'fuji_flyer', score: 2950, isCurrentUser: false },
  { rank: 9, username: 'zentyper', score: 2340, isCurrentUser: false },
  { rank: 10, username: 'hiragana_hero', score: 1890, isCurrentUser: false },
]

const KOTOBA_ALL_TIME_PINNED: LeaderboardEntry = {
  rank: 58,
  username: 'tanuki42',
  score: 890,
  isCurrentUser: true,
}

// ── This Week Kotoba data ────────────────────

const KOTOBA_THIS_WEEK_ENTRIES: readonly LeaderboardEntry[] = [
  { rank: 1, username: 'kanji_king', score: 1420, isCurrentUser: false },
  { rank: 2, username: 'word_wizard', score: 1180, isCurrentUser: false },
  { rank: 3, username: 'sakura_wind', score: 940, isCurrentUser: false },
  { rank: 4, username: 'nihongo_nerd', score: 830, isCurrentUser: false },
  { rank: 5, username: 'matcha_fox', score: 580, isCurrentUser: false },
  { rank: 6, username: 'ramen_rider', score: 460, isCurrentUser: false },
  { rank: 7, username: 'fuji_flyer', score: 310, isCurrentUser: false },
  { rank: 8, username: 'tokyodrift', score: 270, isCurrentUser: false },
  { rank: 9, username: 'zentyper', score: 190, isCurrentUser: false },
  { rank: 10, username: 'hiragana_hero', score: 140, isCurrentUser: false },
]

const KOTOBA_THIS_WEEK_PINNED: LeaderboardEntry = {
  rank: 24,
  username: 'tanuki42',
  score: 65,
  isCurrentUser: true,
}

// ── Fixture accessor ──────────────────────────

export function getLeaderboardFixture(
  gameType: GameType,
  _mode: InputMode,
  timePeriod: TimePeriod,
): LeaderboardBoard {
  if (gameType === 'kotoba') {
    if (timePeriod === 'this-week') {
      return {
        entries: KOTOBA_THIS_WEEK_ENTRIES,
        currentUserPinned: KOTOBA_THIS_WEEK_PINNED,
      }
    }
    return {
      entries: KOTOBA_ALL_TIME_ENTRIES,
      currentUserPinned: KOTOBA_ALL_TIME_PINNED,
    }
  }

  if (timePeriod === 'this-week') {
    return {
      entries: KANA_THIS_WEEK_ENTRIES,
      currentUserPinned: KANA_THIS_WEEK_PINNED,
    }
  }

  return {
    entries: KANA_ALL_TIME_ENTRIES,
    currentUserPinned: KANA_ALL_TIME_PINNED,
  }
}
