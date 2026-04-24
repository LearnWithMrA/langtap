// ─────────────────────────────────────────────
// File: components/dashboard/stats-grid.tsx
// Purpose: Four-card stats grid showing total score, unlocked
//          characters, last practiced time, and distance travelled.
// Depends on: components/dashboard/dashboard-icons.tsx,
//             components/dashboard/dashboard-helpers.ts,
//             samples/dashboard-fixtures.ts
// ─────────────────────────────────────────────

import type { ReactNode } from 'react'
import type { DashboardFixture } from '@/samples/dashboard-fixtures'
import { IconStar, IconLockOpen, IconClock, IconRoad } from '@/components/dashboard/dashboard-icons'
import {
  formatScore,
  formatLastPracticed,
  formatDistance,
} from '@/components/dashboard/dashboard-helpers'

// ── Component ─────────────────────────────────

export function StatsGrid({ stats }: { stats: DashboardFixture['stats'] }): ReactNode {
  const cards = [
    { icon: <IconStar />, value: formatScore(stats.totalScore), label: 'Total Score' },
    {
      icon: <IconLockOpen />,
      value: `${stats.unlockedCount} / ${stats.totalCharacters}`,
      label: 'Unlocked',
    },
    {
      icon: <IconClock />,
      value: formatLastPracticed(stats.lastPracticed),
      label: 'Last Practiced',
    },
    { icon: <IconRoad />, value: formatDistance(stats.distanceMetres), label: 'Distance' },
  ]

  return (
    <div className="grid grid-cols-2 gap-2">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-white/60 rounded-xl px-3 py-2"
          aria-label={`${card.label}: ${card.value}`}
        >
          <div className="mb-1">{card.icon}</div>
          <p className="text-lg font-bold text-warm-800 text-center">{card.value}</p>
          <p className="text-xs text-warm-400 text-center">{card.label}</p>
        </div>
      ))}
    </div>
  )
}
