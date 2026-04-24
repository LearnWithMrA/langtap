// ─────────────────────────────────────────────
// File: components/dashboard/dashboard-icons.tsx
// Purpose: Inline SVG icons used by the game home dashboard.
//          FlameIcon and MiniFlame for streak display,
//          stat icons for the stats grid.
// Depends on: (none)
// ─────────────────────────────────────────────

import type { ReactNode } from 'react'

// ── Streak icons ──────────────────────────────

export function FlameIcon({ colour }: { colour: string }): ReactNode {
  return (
    <svg viewBox="0 0 24 24" width={24} height={24} fill="currentColor" className={colour}>
      <path d="M12 2c0 4-4 6-4 10a4 4 0 0 0 8 0c0-4-4-6-4-10z" />
    </svg>
  )
}

export function MiniFlame({ colour }: { colour: string }): ReactNode {
  return (
    <svg viewBox="0 0 24 24" width={12} height={12} fill="currentColor" className={colour}>
      <path d="M12 2c0 4-4 6-4 10a4 4 0 0 0 8 0c0-4-4-6-4-10z" />
    </svg>
  )
}

// ── Stat icons ────────────────────────────────

export function IconStar(): ReactNode {
  return (
    <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor" className="text-sage-400">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14 2 9.27l6.91-1.01z" />
    </svg>
  )
}

export function IconLockOpen(): ReactNode {
  return (
    <svg
      viewBox="0 0 24 24"
      width={16}
      height={16}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-sage-400"
    >
      <rect x={3} y={11} width={18} height={11} rx={2} />
      <path d="M7 11V7a5 5 0 0 1 9.9-1" />
    </svg>
  )
}

export function IconClock(): ReactNode {
  return (
    <svg
      viewBox="0 0 24 24"
      width={16}
      height={16}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-sage-400"
    >
      <circle cx={12} cy={12} r={10} />
      <path d="M12 6v6l4 2" />
    </svg>
  )
}

export function IconRoad(): ReactNode {
  return (
    <svg
      viewBox="0 0 24 24"
      width={16}
      height={16}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-sage-400"
    >
      <path d="M4 19L8 5" />
      <path d="M20 19L16 5" />
      <path d="M12 7v2" />
      <path d="M12 13v2" />
      <path d="M12 19v2" />
    </svg>
  )
}
