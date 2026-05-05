// ─────────────────────────────────────────────
// File: components/game/practice-loading-shell.tsx
// Purpose: Skeleton placeholder shown while auth and guest usage
//          are resolving. Matches the real game card position,
//          dimensions, and styling so there is no layout shift
//          when the game window mounts. No hooks, no stores,
//          no game logic.
// Depends on: nothing
// ─────────────────────────────────────────────

import type { ReactNode } from 'react'

// ── Main export ───────────────────────────────

export function PracticeLoadingShell(): ReactNode {
  return (
    <div
      className="bg-[#faf5e4] shadow-[0_6px_0_0_#d4c9b0] rounded-2xl w-full max-w-md mx-auto p-6 md:p-8"
      data-testid="practice-loading-shell"
      role="status"
      aria-label="Loading practice"
    >
      <div className="animate-pulse space-y-6">
        <div className="h-16 md:h-20 bg-warm-200/60 rounded-xl" />
        <div className="h-6 bg-warm-200/40 rounded-lg w-3/4 mx-auto" />
        <div className="h-12 bg-warm-200/50 rounded-xl" />
      </div>
    </div>
  )
}
