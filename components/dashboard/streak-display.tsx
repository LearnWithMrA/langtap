// ─────────────────────────────────────────────
// File: components/dashboard/streak-display.tsx
// Purpose: Displays the current streak count with a colour-coded
//          flame icon indicating active, grace, or inactive state.
// Depends on: components/dashboard/dashboard-icons.tsx,
//             samples/dashboard-fixtures.ts
// ─────────────────────────────────────────────

import type { ReactNode } from 'react'
import type { DashboardFixture } from '@/samples/dashboard-fixtures'
import { FlameIcon } from '@/components/dashboard/dashboard-icons'

// ── Component ─────────────────────────────────

export function StreakDisplay({ data }: { data: DashboardFixture }): ReactNode {
  const flameColour =
    data.streak.todayState === 'active'
      ? 'text-feedback-wrong'
      : data.streak.todayState === 'grace'
        ? 'text-blue-400'
        : 'text-warm-300'

  return (
    <div
      className="flex items-center gap-2"
      aria-label={`Current streak: ${data.streak.streakChainDays} days`}
    >
      <FlameIcon colour={flameColour} />
      <span className="text-2xl font-bold text-warm-800">{data.streak.streakChainDays}</span>
      <span className="text-xs text-warm-400">
        {data.streak.streakChainDays === 0 ? 'Start a streak!' : 'day streak'}
      </span>
    </div>
  )
}
