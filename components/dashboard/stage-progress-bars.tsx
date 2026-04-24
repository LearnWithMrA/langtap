// ─────────────────────────────────────────────
// File: components/dashboard/stage-progress-bars.tsx
// Purpose: Renders mastery progress bars for each kana stage
//          (seion, dakuon, yoon) with heat-coloured fills and
//          a total mastered count.
// Depends on: components/dashboard/dashboard-helpers.ts,
//             samples/dashboard-fixtures.ts
// ─────────────────────────────────────────────

import type { ReactNode } from 'react'
import type { StageProgress } from '@/samples/dashboard-fixtures'
import { getProgressHeatClass } from '@/components/dashboard/dashboard-helpers'

// ── Component ─────────────────────────────────

export function StageProgressBars({ stages }: { stages: readonly StageProgress[] }): ReactNode {
  const totalMastered = stages.reduce((sum, s) => sum + s.mastered, 0)
  const totalChars = stages.reduce((sum, s) => sum + s.total, 0)

  return (
    <div className="flex flex-col gap-2">
      {stages.map((stage) => (
        <div key={stage.label}>
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-sm font-medium text-warm-700">{stage.label}</span>
            <span className="text-sm text-warm-500">{stage.percentage}%</span>
          </div>
          <div
            className="h-2 rounded-full bg-warm-100 overflow-hidden"
            role="progressbar"
            aria-valuenow={stage.percentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${stage.label} progress: ${stage.percentage}%`}
          >
            <div
              className={`h-full rounded-full transition-all duration-300 ease-out ${getProgressHeatClass(stage.percentage)}`}
              style={{ width: `${stage.percentage}%` }}
            />
          </div>
        </div>
      ))}
      <p className="text-xs text-warm-400">
        Characters mastered: {totalMastered} / {totalChars}
      </p>
    </div>
  )
}
