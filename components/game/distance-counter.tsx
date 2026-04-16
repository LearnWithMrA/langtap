// ------------------------------------------------------------
// File: components/game/distance-counter.tsx
// Purpose: Odometer-style distance display showing cumulative
//          metres travelled in the active game mode. Plain bold
//          text style to sit inside the game window card.
//          Static display for now; odometer roll animation will
//          be added when live session data flows (Sprint 4).
// Depends on: nothing
// ------------------------------------------------------------

import type { ReactNode } from 'react'

// -- Types --------------------------------------------------

type DistanceCounterProps = {
  value: number
}

// -- Component ----------------------------------------------

export function DistanceCounter({ value }: DistanceCounterProps): ReactNode {
  const clamped = Math.max(0, Math.floor(value))
  const padded = String(clamped).padStart(5, '0')

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`Distance: ${clamped} metres`}
      className="text-base font-bold text-warm-800 tracking-wider"
    >
      {clamped}m
    </div>
  )
}
