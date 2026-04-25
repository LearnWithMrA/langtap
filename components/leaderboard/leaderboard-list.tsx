// ─────────────────────────────────────────────
// File: components/leaderboard/leaderboard-list.tsx
// Purpose: Duolingo-inspired flat leaderboard list. Renders ranked
//          rows with medal badges for top 3, initial-based avatars,
//          and a pinned current-user row when out of view. Reused
//          for both Kana and Kotoba columns.
// Depends on: samples/leaderboard-fixtures.ts
// ─────────────────────────────────────────────

import type { ReactNode } from 'react'
import type { LeaderboardEntry, LeaderboardBoard } from '@/samples/leaderboard-fixtures'
import { getAvatarColor, formatLeaderboardScore } from '@/samples/leaderboard-fixtures'

// ── Types ─────────────────────────────────────

type LeaderboardListProps = {
  board: LeaderboardBoard
  variant: 'kana' | 'kotoba'
  modeName: string
  locked?: boolean
}

// ── Medal component ───────────────────────────

function MedalBadge({ rank }: { rank: number }): ReactNode {
  const colors: Record<number, string> = {
    1: 'bg-medal-gold',
    2: 'bg-medal-silver',
    3: 'bg-medal-bronze',
  }
  const textColors: Record<number, string> = {
    1: 'text-white',
    2: 'text-white',
    3: 'text-white',
  }

  return (
    <div
      className={`w-8 h-8 rounded-full ${colors[rank]} ${textColors[rank]} flex items-center justify-center shrink-0`}
      aria-label={`Rank ${rank}`}
    >
      <span className="text-xs font-bold">{rank}</span>
    </div>
  )
}

// ── Avatar component ──────────────────────────

function Avatar({ username, size }: { username: string; size: 'sm' | 'md' }): ReactNode {
  const initial = username.charAt(0).toUpperCase()
  const bgColor = getAvatarColor(username)
  const sizeClass = size === 'md' ? 'w-10 h-10 text-base' : 'w-9 h-9 text-sm'

  return (
    <div
      className={`${sizeClass} rounded-full ${bgColor} flex items-center justify-center shrink-0`}
      aria-hidden="true"
    >
      <span className="font-bold text-white">{initial}</span>
    </div>
  )
}

// ── Row component ─────────────────────────────

function LeaderboardRow({
  entry,
  variant,
}: {
  entry: LeaderboardEntry
  variant: 'kana' | 'kotoba'
}): ReactNode {
  const isTop3 = entry.rank <= 3
  const scoreColor = variant === 'kana' ? 'text-sky-600' : 'text-sage-600'

  return (
    <div
      role="listitem"
      aria-current={entry.isCurrentUser ? 'true' : undefined}
      className={`flex items-center gap-3 px-4 py-3 ${
        entry.isCurrentUser
          ? 'bg-sage-50 border-l-4 border-sage-500'
          : 'border-l-4 border-transparent'
      }`}
    >
      {isTop3 ? (
        <MedalBadge rank={entry.rank} />
      ) : (
        <div className="w-8 h-8 flex items-center justify-center shrink-0">
          <span className="text-sm font-bold text-warm-500">{entry.rank}</span>
        </div>
      )}

      <Avatar username={entry.username} size={isTop3 ? 'md' : 'sm'} />

      <span
        className={`flex-1 truncate ${
          isTop3 ? 'text-base font-medium text-warm-800' : 'text-sm text-warm-800'
        } ${entry.isCurrentUser ? 'font-bold' : ''}`}
      >
        {entry.username}
      </span>

      <span className={`${isTop3 ? 'text-base' : 'text-sm'} font-medium ${scoreColor} shrink-0`}>
        {formatLeaderboardScore(entry.score)}
      </span>
    </div>
  )
}

// ── Skeleton loader ───────────────────────────

function SkeletonRows(): ReactNode {
  return (
    <div className="animate-pulse flex flex-col">
      {Array.from({ length: 7 }, (_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <div className="w-8 h-8 rounded-full bg-warm-200" />
          <div className="w-9 h-9 rounded-full bg-warm-200" />
          <div className="flex-1 h-4 rounded bg-warm-200" />
          <div className="w-12 h-4 rounded bg-warm-200" />
        </div>
      ))}
    </div>
  )
}

// ── Main export ───────────────────────────────

export function LeaderboardList({
  board,
  variant,
  modeName,
  locked = false,
}: LeaderboardListProps): ReactNode {
  const accentColor = variant === 'kana' ? 'text-sky-600' : 'text-sage-600'
  const label = variant === 'kana' ? 'Kana' : 'Kotoba'

  if (locked) {
    return (
      <div className="bg-surface-raised rounded-2xl border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h2 className={`text-lg font-bold ${accentColor}`}>{label}</h2>
          <p className="text-xs text-warm-400">{modeName} Leaderboard</p>
        </div>
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center opacity-60">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-warm-400 mb-3"
            aria-hidden="true"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <p className="text-sm font-medium text-warm-600">Complete Kana to unlock</p>
          <p className="text-xs text-warm-400 mt-1">Kotoba leaderboard opens after Kana mastery</p>
        </div>
      </div>
    )
  }

  const hasEntries = board.entries.length > 0
  const currentUserInList = board.entries.some((e) => e.isCurrentUser)

  return (
    <div className="bg-surface-raised rounded-2xl border border-border overflow-hidden">
      {/* Column header */}
      <div className="px-4 py-3 border-b border-border">
        <h2 className={`text-lg font-bold ${accentColor}`}>{label}</h2>
        <p className="text-xs text-warm-400">{modeName} Leaderboard</p>
      </div>

      {/* List */}
      {hasEntries ? (
        <div role="list" aria-label={`${label} ${modeName} leaderboard`}>
          {board.entries.map((entry, i) => (
            <div key={entry.username}>
              {i > 0 && <div className="mx-4 border-t border-border" />}
              <LeaderboardRow entry={entry} variant={variant} />
            </div>
          ))}

          {/* Pinned current user row */}
          {board.currentUserPinned && !currentUserInList && (
            <>
              <div className="mx-4 border-t-2 border-dashed border-warm-300 my-1" />
              <LeaderboardRow entry={board.currentUserPinned} variant={variant} />
            </>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
          <p className="text-sm text-warm-500">No scores yet. Start practising to appear here.</p>
          <button
            type="button"
            className="mt-4 bg-mint-500 text-white text-sm font-bold px-6 py-3 rounded-xl shadow-[0_4px_0_0_#2e9a73] active:translate-y-[2px] active:shadow-none transition-all duration-75 min-h-[44px]"
            aria-label="Start practising"
          >
            Start practising
          </button>
        </div>
      )}
    </div>
  )
}

export { SkeletonRows }
