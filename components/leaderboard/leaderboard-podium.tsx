// ─────────────────────────────────────────────
// File: components/leaderboard/leaderboard-podium.tsx
// Purpose: Podium display for top 3 leaderboard entries. Circular
//          avatars with colored rings, rank number badges overlapping
//          top-left, sparkle decorations for rank 1. Used on both
//          mobile and desktop views.
// Depends on: samples/leaderboard-fixtures.ts
// ─────────────────────────────────────────────

import type { ReactNode } from 'react'
import type { LeaderboardEntry } from '@/samples/leaderboard-fixtures'
import { getAvatarColor, formatLeaderboardScore } from '@/samples/leaderboard-fixtures'

// ── Sparkle SVG ──────────────────────────────

function Sparkle({ className }: { className: string }): ReactNode {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" className={className} aria-hidden="true">
      <path
        d="M6 0L7.1 4.1L11.2 4.4L8 7.1L9 11.2L6 8.9L3 11.2L4 7.1L0.8 4.4L4.9 4.1L6 0Z"
        fill="var(--color-medal-gold)"
      />
    </svg>
  )
}

// ── Rank number badge ────────────────────────

function RankNumberBadge({ rank }: { rank: number }): ReactNode {
  const bgMap: Record<number, string> = {
    1: 'bg-medal-gold',
    2: 'bg-medal-silver',
    3: 'bg-medal-bronze',
  }

  return (
    <div
      className={`absolute -top-1 -left-1 z-10 w-5 h-5 sm:w-7 sm:h-7 rounded-full ${bgMap[rank] ?? 'bg-warm-400'} flex items-center justify-center shadow-md`}
      aria-label={`Rank ${rank}`}
    >
      <span className="text-[10px] sm:text-xs font-bold text-white">{rank}</span>
    </div>
  )
}

// ── Rank badge (for row display) ─────────────

export function RankBadge({ rank }: { rank: number }): ReactNode {
  if (rank >= 1 && rank <= 3) {
    const bgMap: Record<number, string> = {
      1: 'bg-medal-gold',
      2: 'bg-medal-silver',
      3: 'bg-medal-bronze',
    }
    return (
      <div
        className={`w-8 h-8 rounded-full ${bgMap[rank]} flex items-center justify-center shrink-0`}
        aria-label={`Rank ${rank}`}
      >
        <span className="text-xs font-bold text-white">{rank}</span>
      </div>
    )
  }

  return (
    <div className="w-8 h-8 flex items-center justify-center shrink-0">
      <span className="text-sm font-bold text-warm-500">{rank}</span>
    </div>
  )
}

// ── Podium entry ─────────────────────────────

function PodiumEntry({
  entry,
  variant,
  position,
}: {
  entry: LeaderboardEntry
  variant: 'kana' | 'kotoba'
  position: 'first' | 'second' | 'third'
}): ReactNode {
  const scoreColor = variant === 'kana' ? 'text-sky-600' : 'text-sage-600'
  const bgColor = getAvatarColor(entry.username)
  const initial = entry.username.charAt(0).toUpperCase()
  const isFirst = position === 'first'

  const ringColor: Record<string, string> = {
    first: 'ring-medal-gold',
    second: 'ring-medal-silver',
    third: 'ring-medal-bronze',
  }

  const avatarOuter = isFirst ? 'w-16 h-16 sm:w-20 sm:h-20' : 'w-11 h-11 sm:w-14 sm:h-14'
  const avatarInner = isFirst
    ? 'w-14 h-14 sm:w-[72px] sm:h-[72px] text-xl sm:text-2xl'
    : 'w-9 h-9 sm:w-12 sm:h-12 text-sm sm:text-base'
  const ringWidth = 'ring-[3px]'

  return (
    <div
      className={`flex flex-col items-center gap-1 sm:gap-1.5 ${isFirst ? 'w-[72px] sm:w-24' : 'w-16 sm:w-20 mt-4 sm:mt-6'}`}
    >
      {/* Avatar with ring and rank badge */}
      <div className={`relative ${avatarOuter} flex items-center justify-center`}>
        {isFirst && (
          <>
            <Sparkle className="absolute -top-2 sm:-top-3 -right-1 sm:-right-3 opacity-0 [animation:sparkle_2.4s_ease-in-out_infinite] scale-75 sm:scale-100" />
            <Sparkle className="absolute -top-1 sm:-top-2 -left-2 sm:-left-4 opacity-0 [animation:sparkle_2.4s_ease-in-out_0.8s_infinite] scale-75 sm:scale-100" />
            <Sparkle className="absolute top-1 -right-3 sm:-right-5 opacity-0 [animation:sparkle_2.4s_ease-in-out_1.6s_infinite] scale-50 sm:scale-75" />
            <Sparkle className="absolute -bottom-1 -left-1 sm:-left-3 opacity-0 [animation:sparkle_2.4s_ease-in-out_1.2s_infinite] scale-50" />
          </>
        )}

        <RankNumberBadge rank={entry.rank} />

        <div
          className={`${avatarInner} rounded-full ${bgColor} ${ringWidth} ${ringColor[position]} flex items-center justify-center ${
            isFirst ? '[animation:trophy-float_3s_ease-in-out_infinite]' : ''
          }`}
          aria-hidden="true"
        >
          <span className="font-bold text-white">{initial}</span>
        </div>
      </div>

      {/* Username */}
      <span
        className={`${
          isFirst
            ? 'text-xs sm:text-sm font-bold text-warm-800'
            : 'text-[10px] sm:text-xs font-medium text-warm-600'
        } truncate w-full text-center`}
      >
        {entry.username}
      </span>

      {/* Score */}
      <span
        className={`${isFirst ? 'text-sm sm:text-base' : 'text-xs sm:text-sm'} font-bold ${scoreColor} w-full text-center`}
      >
        {formatLeaderboardScore(entry.score)}
      </span>
    </div>
  )
}

// ── Main export ──────────────────────────────

export function Podium({
  entries,
  variant,
}: {
  entries: readonly LeaderboardEntry[]
  variant: 'kana' | 'kotoba'
}): ReactNode {
  const first = entries.find((e) => e.rank === 1)
  const second = entries.find((e) => e.rank === 2)
  const third = entries.find((e) => e.rank === 3)

  if (!first) return null

  return (
    <div className="flex items-start justify-center gap-3 sm:gap-10 px-2 sm:px-4 pt-5 sm:pt-6 pb-3 sm:pb-4">
      {second && <PodiumEntry entry={second} variant={variant} position="second" />}
      <PodiumEntry entry={first} variant={variant} position="first" />
      {third && <PodiumEntry entry={third} variant={variant} position="third" />}
    </div>
  )
}
