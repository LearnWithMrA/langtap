// ─────────────────────────────────────────────
// File: utils/leaderboard.ts
// Purpose: Pure utility functions for leaderboard display.
// Depends on: nothing
// ─────────────────────────────────────────────

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
