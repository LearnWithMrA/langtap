// ─────────────────────────────────────────────
// File: components/dashboard/heatmap-calendar.tsx
// Purpose: Practice heatmap calendar showing a 14-day strip on
//          narrow screens and a full month grid on wider screens.
//          Includes calendar grid-building helpers.
// Depends on: components/dashboard/dashboard-icons.tsx,
//             components/dashboard/dashboard-helpers.ts,
//             samples/dashboard-fixtures.ts
// ─────────────────────────────────────────────

'use client'

import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { HeatmapDay } from '@/samples/dashboard-fixtures'
import { MiniFlame } from '@/components/dashboard/dashboard-icons'
import { getHeatClass } from '@/components/dashboard/dashboard-helpers'

// ── Calendar helpers ──────────────────────────

/** Builds a full month calendar grid from the heatmap data. */
function buildMonthGrid(heatmap: readonly HeatmapDay[]): {
  monthLabel: string
  dayLabels: string[]
  weeks: (HeatmapDay | null)[][]
} {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()
  const monthLabel = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDow = firstDay.getDay()

  const heatmapMap = new Map(heatmap.map((d) => [d.date, d]))
  const weeks: (HeatmapDay | null)[][] = []
  let currentWeek: (HeatmapDay | null)[] = Array.from<null>({ length: startDow }).fill(null)

  for (let day = 1; day <= lastDay.getDate(); day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const hd = heatmapMap.get(dateStr) ?? {
      date: dateStr,
      charactersPracticed: 0,
      streakFlame: null,
    }
    currentWeek.push(hd)
    if (currentWeek.length === 7) {
      weeks.push(currentWeek)
      currentWeek = []
    }
  }
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) currentWeek.push(null)
    weeks.push(currentWeek)
  }

  return { monthLabel, dayLabels, weeks }
}

/** Returns the trailing 14 days of heatmap data ending at today. */
function getTrailing14Days(heatmap: readonly HeatmapDay[]): HeatmapDay[] {
  const today = new Date()
  const days: HeatmapDay[] = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().slice(0, 10)
    const found = heatmap.find((h) => h.date === dateStr)
    days.push(found ?? { date: dateStr, charactersPracticed: 0, streakFlame: null })
  }
  return days
}

// ── Component ─────────────────────────────────

export function HeatmapCalendar({ heatmap }: { heatmap: readonly HeatmapDay[] }): ReactNode {
  const [expanded, setExpanded] = useState(false)
  const trailing14 = useMemo(() => getTrailing14Days(heatmap), [heatmap])
  const monthGrid = useMemo(() => buildMonthGrid(heatmap), [heatmap])
  const todayStr = new Date().toISOString().slice(0, 10)

  const practicedCount = trailing14.filter((d) => d.charactersPracticed > 0).length

  return (
    <div
      role="img"
      aria-label={`Practice activity for ${monthGrid.monthLabel}. Practiced ${practicedCount} of last 14 days.`}
    >
      {/* 14-day strip (shown on small screens, or when month is collapsed) */}
      <div className={expanded ? 'hidden' : 'block min-[375px]:hidden'}>
        <div className="grid grid-cols-7 gap-1 mb-1">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((label, i) => (
            <span key={`strip-label-${i}`} className="text-xs text-warm-400 text-center">
              {label}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {trailing14.map((day) => (
            <div
              key={day.date}
              className={`relative rounded-sm ${getHeatClass(day.charactersPracticed)} ${
                day.date === todayStr ? 'ring-2 ring-sage-400' : ''
              }`}
              style={{ aspectRatio: '1' }}
            >
              {day.streakFlame && (
                <span className="absolute top-0 right-0">
                  <MiniFlame
                    colour={day.streakFlame === 'red' ? 'text-feedback-wrong' : 'text-blue-400'}
                  />
                </span>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={(): void => setExpanded(true)}
          className="text-xs text-sage-500 hover:text-sage-600 mt-1 transition-colors duration-150"
        >
          View month
        </button>
      </div>

      {/* Full month calendar (shown on 375px+ or when expanded) */}
      <div className={expanded ? 'block' : 'hidden min-[375px]:block'}>
        <p className="text-sm font-medium text-warm-600 mb-2">{monthGrid.monthLabel}</p>
        <div className="grid grid-cols-7 gap-1 mb-1">
          {monthGrid.dayLabels.map((label, i) => (
            <span key={`month-label-${i}`} className="text-xs text-warm-400 text-center">
              {label}
            </span>
          ))}
        </div>
        {monthGrid.weeks.map((week, wi) => (
          <div key={`week-${wi}`} className="grid grid-cols-7 gap-1 mb-1">
            {week.map((day, di) => {
              if (!day) {
                return <div key={`empty-${wi}-${di}`} />
              }
              const isFuture = day.date > todayStr
              return (
                <div
                  key={day.date}
                  className={`relative rounded-sm ${
                    isFuture ? 'bg-warm-50 opacity-40' : getHeatClass(day.charactersPracticed)
                  } ${day.date === todayStr ? 'ring-2 ring-sage-400' : ''}`}
                  style={{ aspectRatio: '1' }}
                >
                  {day.streakFlame && !isFuture && (
                    <span className="absolute top-0 right-0">
                      <MiniFlame
                        colour={day.streakFlame === 'red' ? 'text-feedback-wrong' : 'text-blue-400'}
                      />
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        ))}
        {expanded && (
          <button
            type="button"
            onClick={(): void => setExpanded(false)}
            className="text-xs text-sage-500 hover:text-sage-600 mt-1 min-[375px]:hidden transition-colors duration-150"
          >
            Show less
          </button>
        )}
      </div>
    </div>
  )
}
