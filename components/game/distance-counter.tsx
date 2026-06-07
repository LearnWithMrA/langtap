// ------------------------------------------------------------
// File: components/game/distance-counter.tsx
// Purpose: Odometer-style distance display showing cumulative
//          metres travelled in the active game mode. Uses the
//          same format as the leaderboard for consistency.
// Depends on: utils/leaderboard.ts
// ------------------------------------------------------------

import type { ReactNode } from 'react'
import { formatLeaderboardScore } from '@/utils/leaderboard'

// -- Types --------------------------------------------------

type DistanceCounterProps = {
  value: number
}

// -- Component ----------------------------------------------

export function DistanceCounter({ value }: DistanceCounterProps): ReactNode {
  const clamped = Math.max(0, Math.floor(value))
  const formatted = formatLeaderboardScore(clamped)

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`Distance: ${clamped} metres`}
      className="text-base font-bold text-warm-800 tracking-wider"
    >
      {formatted}m
    </div>
  )
}
