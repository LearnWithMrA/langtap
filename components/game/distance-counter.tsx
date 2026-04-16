// ------------------------------------------------------------
// File: components/game/distance-counter.tsx
// Purpose: Odometer-style distance display showing cumulative
//          metres travelled in the active game mode. Rendered as
//          a semi-transparent capsule over the landscape scene.
//          Static display for now; odometer roll animation will
//          be added when live session data flows (Sprint 4).
// Depends on: nothing
// ------------------------------------------------------------

'use client'

import type { ReactNode } from 'react'

// -- Types --------------------------------------------------

type DistanceCounterProps = {
  value: number
  mode: 'kana' | 'kotoba'
}

// -- Component ----------------------------------------------

export function DistanceCounter({ value, mode }: DistanceCounterProps): ReactNode {
  const clamped = Math.max(0, Math.floor(value))
  const padded = String(clamped).padStart(5, '0')
  const modeLabel = mode === 'kana' ? 'Kana' : 'Kotoba'

  return (
    <div
      className="bg-warm-800/60 backdrop-blur-sm rounded-lg px-4 py-2 text-center"
      role="status"
      aria-live="polite"
      aria-label={`Distance: ${clamped} metres`}
    >
      <div className="font-mono text-lg md:text-xl font-bold text-white tracking-widest">
        {padded}m
      </div>
      <div className="text-xs text-white/70 mt-0.5">
        {modeLabel}
      </div>
    </div>
  )
}
