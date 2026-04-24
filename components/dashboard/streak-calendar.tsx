// ─────────────────────────────────────────────
// File: components/dashboard/streak-calendar.tsx
// Purpose: Streak calendar widget inspired by the Figma community
//          "Streak Calendar Widget" design. Circles for each day:
//          grey inactive, gold practiced (no streak), gold+flame
//          for streak days. A rounded highlight band sits behind
//          consecutive streak rows. Month navigation with arrows.
// Depends on: samples/dashboard-fixtures.ts
// ─────────────────────────────────────────────

'use client'

import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { HeatmapDay } from '@/samples/dashboard-fixtures'

// ── Constants ─────────────────────────────────

const DAY_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

// ── Flame SVG icon ────────────────────────────

function FlameIcon({ size, blue = false }: { size: number; blue?: boolean }): ReactNode {
  const glowColor = blue ? '#A8D4F0' : '#FFCE51'
  const bodyColor = blue ? '#4A9BD9' : '#FF7324'

  return (
    <svg
      width={size}
      height={size}
      viewBox="2 0 35 39"
      fill="none"
      className="absolute inset-0 m-auto"
    >
      <ellipse cx="21.7" cy="24.1" rx="6.03" ry="8.44" fill={glowColor} />
      <path
        d="M31.3 19.85c-2.52-6.56-11.5-6.91-9.34-16.44.16-.71-.6-1.25-1.21-.88C14.93 5.96 10.74 12.86 14.26 21.89c.29.74-.58 1.43-1.2.95-2.91-2.2-3.22-5.37-2.96-7.64.1-.84-.99-1.24-1.46-.55-1.1 1.67-2.2 4.37-2.2 8.44.61 9 8.21 11.76 10.94 12.12 3.91.5 8.13-.22 11.17-3 3.34-3.1 4.56-8.05 2.76-12.36zm-14.91 8.08c2.31-.56 3.5-2.23 3.82-3.71.53-2.3-1.54-4.55.84-8.18.53 3 5.26 4.89 5.26 8.16.13 4.07-4.27 7.55-8.93 3.73z"
        fill={bodyColor}
      />
    </svg>
  )
}

// ── Arrow icons ───────────────────────────────

function ArrowLeft(): ReactNode {
  return (
    <svg width="8" height="12" viewBox="0 0 17 26" fill="none">
      <path
        d="M16.24 2.96L6.2 12.62l10.05 9.65-3.11 2.97L0 12.62 13.13 0l3.11 2.96z"
        fill="#848A95"
      />
    </svg>
  )
}

function ArrowRight(): ReactNode {
  return (
    <svg width="8" height="12" viewBox="0 0 17 26" fill="none">
      <path d="M0 22.27l10.05-9.65L0 2.96 3.11 0l13.13 12.62L3.11 25.23 0 22.27z" fill="#848A95" />
    </svg>
  )
}

// ── Calendar helpers ──────────────────────────

type CalendarWeek = (HeatmapDay | null)[]

function buildMonthGrid(
  year: number,
  month: number,
  heatmap: readonly HeatmapDay[],
): { weeks: CalendarWeek[]; monthLabel: string } {
  const date = new Date(year, month)
  const monthLabel = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  let startDow = firstDay.getDay()
  startDow = startDow === 0 ? 6 : startDow - 1

  const heatmapMap = new Map(heatmap.map((d) => [d.date, d]))
  const weeks: CalendarWeek[] = []
  let currentWeek: CalendarWeek = Array.from<null>({ length: startDow }).fill(null)

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

  return { weeks, monthLabel }
}

// ── Day circle component ──────────────────────

function DayCircle({ day, cellSize }: { day: HeatmapDay | null; cellSize: number }): ReactNode {
  if (!day) {
    return <div style={{ width: cellSize, height: cellSize }} />
  }

  const todayStr = new Date().toISOString().slice(0, 10)
  const isFuture = day.date > todayStr
  const hasFlame = day.streakFlame === 'red'
  const hasBlueFlame = day.streakFlame === 'blue'
  const practiced = day.charactersPracticed > 0

  let bgColor = '#B0B5BE'
  if (isFuture) {
    bgColor = '#D0D3D8'
  } else if (hasBlueFlame) {
    bgColor = '#A8D4F0'
  } else if (hasFlame) {
    bgColor = '#FFCE51'
  } else if (practiced) {
    bgColor = '#FFCE51'
  }

  const flameSize = cellSize * 0.85

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: cellSize, height: cellSize }}
    >
      <div
        className="rounded-full"
        style={{
          width: cellSize,
          height: cellSize,
          backgroundColor: bgColor,
          opacity: isFuture ? 0.4 : 1,
        }}
      />
      {hasFlame && !isFuture && <FlameIcon size={flameSize} />}
      {hasBlueFlame && !isFuture && <FlameIcon size={flameSize} blue />}
    </div>
  )
}

// ── Streak band calculation ───────────────────

function getStreakRanges(
  week: CalendarWeek,
  currentStreakDates: Set<string>,
): { start: number; end: number }[] {
  const ranges: { start: number; end: number }[] = []
  let runStart: number | null = null

  for (let i = 0; i < 7; i++) {
    const day = week[i]
    const isCurrentStreak = day !== null && currentStreakDates.has(day.date)
    if (isCurrentStreak) {
      if (runStart === null) runStart = i
    } else {
      if (runStart !== null && i - runStart >= 2) {
        ranges.push({ start: runStart, end: i - 1 })
      }
      runStart = null
    }
  }
  if (runStart !== null && 7 - runStart >= 2) {
    ranges.push({ start: runStart, end: 6 })
  }
  return ranges
}

// ── Main component ────────────────────────────

export function StreakCalendar({
  heatmap,
  streakCount,
}: {
  heatmap: readonly HeatmapDay[]
  streakCount: number
}): ReactNode {
  const today = new Date()
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [viewYear, setViewYear] = useState(today.getFullYear())

  const { weeks, monthLabel } = useMemo(
    () => buildMonthGrid(viewYear, viewMonth, heatmap),
    [viewYear, viewMonth, heatmap],
  )

  const currentStreakDates = useMemo(() => {
    const dates = new Set<string>()
    if (streakCount === 0) return dates
    const sorted = [...heatmap].sort((a, b) => (a.date > b.date ? -1 : 1))
    for (const day of sorted) {
      if (day.streakFlame !== null) {
        dates.add(day.date)
      } else {
        break
      }
    }
    return dates
  }, [heatmap, streakCount])

  const prevMonth = (): void => {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear(viewYear - 1)
    } else {
      setViewMonth(viewMonth - 1)
    }
  }

  const nextMonth = (): void => {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear(viewYear + 1)
    } else {
      setViewMonth(viewMonth + 1)
    }
  }

  const cellSize = 26
  const cellGap = 6

  return (
    <div className="bg-white/60 backdrop-blur-md rounded-2xl shadow-lg px-3 py-1.5 sm:px-4 sm:py-2 overflow-hidden">
      {/* Month header */}
      <div className="flex items-center justify-between -mx-1 mb-1">
        <button
          type="button"
          onClick={prevMonth}
          className="p-1 rounded-lg hover:bg-white/40 transition-colors duration-150 min-h-[32px] min-w-[32px] flex items-center justify-center"
          aria-label="Previous month"
        >
          <ArrowLeft />
        </button>
        <span className="text-sm font-bold text-warm-800 tracking-wide">{monthLabel}</span>
        <button
          type="button"
          onClick={nextMonth}
          className="p-1 rounded-lg hover:bg-white/40 transition-colors duration-150 min-h-[32px] min-w-[32px] flex items-center justify-center"
          aria-label="Next month"
        >
          <ArrowRight />
        </button>
      </div>

      {/* Separator */}
      <div className="h-px bg-warm-200/60 mb-1" />

      {/* Day labels */}
      <div className="grid grid-cols-7 mb-1.5" style={{ gap: cellGap }}>
        {DAY_LABELS.map((label) => (
          <div
            key={label}
            className="text-[10px] font-bold text-warm-400 text-center"
            style={{ width: cellSize }}
          >
            {label}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="flex flex-col" style={{ gap: cellGap }}>
        {weeks.map((week, wi) => {
          const streakRanges = getStreakRanges(week, currentStreakDates)

          return (
            <div key={`week-${wi}`} className="relative grid grid-cols-7" style={{ gap: cellGap }}>
              {/* Streak highlight bands: grid overlay matching the same 7-col layout */}
              {streakRanges.length > 0 && (
                <div
                  className="absolute inset-0 grid grid-cols-7 pointer-events-none"
                  style={{ gap: cellGap }}
                >
                  {Array.from({ length: 7 }, (_, i) => {
                    const range = streakRanges.find((r) => i >= r.start && i <= r.end)
                    if (!range) return <div key={`gap-${wi}-${i}`} />

                    const isFirst = i === range.start
                    const isLast = i === range.end

                    return (
                      <div
                        key={`hl-${wi}-${i}`}
                        style={{
                          backgroundColor: 'rgba(255, 206, 81, 0.35)',
                          margin: '-2.5px 0',
                          marginLeft: isFirst ? '-2.5px' : `-${cellGap / 2}px`,
                          marginRight: isLast ? '-2.5px' : `-${cellGap / 2}px`,
                          borderRadius:
                            isFirst && isLast
                              ? '9999px'
                              : isFirst
                                ? '9999px 0 0 9999px'
                                : isLast
                                  ? '0 9999px 9999px 0'
                                  : '0',
                        }}
                      />
                    )
                  })}
                </div>
              )}
              {/* Day circles */}
              {week.map((day, di) => (
                <div key={`day-${wi}-${di}`} className="relative z-[1] flex justify-center">
                  <DayCircle day={day} cellSize={cellSize} />
                </div>
              ))}
            </div>
          )
        })}
      </div>

      {/* Streak count below calendar */}
      <div className="flex items-center justify-center gap-1.5 mt-1.5 pt-1 border-t border-warm-200/60">
        <span className="inline-block" style={{ width: 18, height: 18 }}>
          <svg width="18" height="18" viewBox="0 0 39 39" fill="none">
            <ellipse cx="21.7" cy="24.1" rx="6.03" ry="8.44" fill="#FFCE51" />
            <path
              d="M31.3 19.85c-2.52-6.56-11.5-6.91-9.34-16.44.16-.71-.6-1.25-1.21-.88C14.93 5.96 10.74 12.86 14.26 21.89c.29.74-.58 1.43-1.2.95-2.91-2.2-3.22-5.37-2.96-7.64.1-.84-.99-1.24-1.46-.55-1.1 1.67-2.2 4.37-2.2 8.44.61 9 8.21 11.76 10.94 12.12 3.91.5 8.13-.22 11.17-3 3.34-3.1 4.56-8.05 2.76-12.36zm-14.91 8.08c2.31-.56 3.5-2.23 3.82-3.71.53-2.3-1.54-4.55.84-8.18.53 3 5.26 4.89 5.26 8.16.13 4.07-4.27 7.55-8.93 3.73z"
              fill="#FF7324"
            />
          </svg>
        </span>
        <span className="text-xs font-bold text-warm-700">
          {streakCount > 0 ? `${streakCount} day streak` : 'Start a streak!'}
        </span>
      </div>
    </div>
  )
}
