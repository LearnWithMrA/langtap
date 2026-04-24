// ─────────────────────────────────────────────
// File: components/dashboard/leaderboard-glance.tsx
// Purpose: Compact leaderboard summary showing the user's rank,
//          username, and score with a link to the full leaderboard.
// Depends on: components/dashboard/dashboard-helpers.ts,
//             samples/dashboard-fixtures.ts
// ─────────────────────────────────────────────

import type { ReactNode } from 'react'
import type { DashboardFixture } from '@/samples/dashboard-fixtures'
import { formatScore } from '@/components/dashboard/dashboard-helpers'

// ── Component ─────────────────────────────────

export function LeaderboardGlance({ data }: { data: DashboardFixture['leaderboard'] }): ReactNode {
  return (
    <div>
      <p className="text-sm font-medium text-warm-600 mb-2">Leaderboard</p>
      {data.rank ? (
        <div
          className="bg-sage-50 rounded-lg px-3 py-2 border-l-4 border-sage-500 flex items-center justify-between"
          aria-label={`Your leaderboard position: rank ${data.rank}`}
        >
          <span className="text-base font-bold text-warm-800">#{data.rank}</span>
          <span className="text-sm text-warm-600">{data.username}</span>
          <span className="text-sm font-medium text-sage-500">{formatScore(data.score)}</span>
        </div>
      ) : (
        <p className="text-sm text-warm-400 italic">Practice to get on the board</p>
      )}
      <a
        href="/leaderboard"
        className="text-sm text-sage-500 hover:text-sage-600 mt-2 inline-block transition-colors duration-150"
      >
        View full leaderboard
      </a>
    </div>
  )
}
