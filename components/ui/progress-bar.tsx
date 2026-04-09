// ------------------------------------------------------------
// File: components/ui/progress-bar.tsx
// Purpose: Mastery progress bar with heatmap colour support.
//          Used in the Dojo for per-character progress display.
//          Score is clamped to [0, Infinity). Invalid heatClass
//          values fall back to 'bg-heat-0' with a dev warning.
//          Locked state overrides all colour with bg-heat-0 + opacity.
// Depends on: nothing (heatClass is passed in from engine/mastery.ts)
// ------------------------------------------------------------

'use client'

import type { ReactNode } from 'react'

// -- Types -------------------------------------------------------

type ProgressBarProps = {
  score: number
  heatClass: string
  isLocked?: boolean
  label?: string
}

// -- Constants ---------------------------------------------------

// Score at which the bar is considered full (maps to 100% width visually)
const MAX_DISPLAY_SCORE = 40

const VALID_HEAT_CLASS = /^bg-heat-[0-5]$/

// -- Helpers -----------------------------------------------------

// Validates heatClass and returns a safe fallback if invalid
function resolveHeatClass(heatClass: string): string {
  if (VALID_HEAT_CLASS.test(heatClass)) return heatClass
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.warn(
      `ProgressBar: invalid heatClass "${heatClass}". Expected bg-heat-0 through bg-heat-5. Falling back to bg-heat-0.`,
    )
  }
  return 'bg-heat-0'
}

// Converts a score to a fill percentage clamped between 0 and 100
function scoreToPercent(score: number): number {
  const clamped = Math.max(0, isNaN(score) ? 0 : score)
  return Math.min(100, Math.round((clamped / MAX_DISPLAY_SCORE) * 100))
}

// -- Component ---------------------------------------------------

export function ProgressBar({
  score,
  heatClass,
  isLocked = false,
  label,
}: ProgressBarProps): ReactNode {
  const fillPercent = scoreToPercent(score)
  const resolvedClass = isLocked ? 'bg-heat-0' : resolveHeatClass(heatClass)
  const ariaLabel = label ?? `Mastery score: ${score}`

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.max(0, isNaN(score) ? 0 : score)}
      aria-valuemin={0}
      aria-valuemax={MAX_DISPLAY_SCORE}
      aria-label={ariaLabel}
      className="h-2 w-full bg-warm-200 rounded-full overflow-hidden"
    >
      <div
        className={[
          'h-full rounded-full transition-all duration-300 ease-out',
          resolvedClass,
          isLocked ? 'opacity-50' : '',
        ].join(' ')}
        style={{ width: isLocked ? '0%' : `${fillPercent}%` }}
      />
    </div>
  )
}
