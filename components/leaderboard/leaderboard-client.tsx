// ─────────────────────────────────────────────
// File: components/leaderboard/leaderboard-client.tsx
// Purpose: Leaderboard page orchestrator. Mode selector (Tap/Type/Swipe),
//          time period switcher (All Time/This Week), and responsive
//          layout: side-by-side Kana + Kotoba on desktop, single column
//          with game-type pill on mobile.
// Depends on: components/leaderboard/leaderboard-list.tsx,
//             samples/leaderboard-fixtures.ts
// ─────────────────────────────────────────────

'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import { AppTopBar } from '@/components/layout/app-top-bar'
import { LeaderboardList, SkeletonRows } from '@/components/leaderboard/leaderboard-list'
import type { InputMode, TimePeriod, GameType } from '@/samples/leaderboard-fixtures'
import { getLeaderboardFixture } from '@/samples/leaderboard-fixtures'

// ── Types ─────────────────────────────────────

type PillOption<T extends string> = {
  value: T
  label: string
}

// ── Constants ─────────────────────────────────

const TIME_OPTIONS: readonly PillOption<TimePeriod>[] = [
  { value: 'all-time', label: 'All Time' },
  { value: 'this-week', label: 'This Week' },
]

const GAME_OPTIONS: readonly PillOption<GameType>[] = [
  { value: 'kana', label: 'Kana' },
  { value: 'kotoba', label: 'Kotoba' },
]

const MODE_LABELS: Record<InputMode, string> = {
  tap: 'Tap',
  type: 'Type',
  swipe: 'Swipe',
}

// ── Pill selector ─────────────────────────────

function PillSelector<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  size = 'default',
}: {
  options: readonly PillOption<T>[]
  value: T
  onChange: (v: T) => void
  ariaLabel: string
  size?: 'default' | 'small'
}): ReactNode {
  const padding = size === 'small' ? 'px-3 py-1.5 text-xs min-h-[36px]' : 'px-4 py-2 text-sm min-h-[44px]'

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="inline-flex bg-warm-100 rounded-xl p-1 gap-0.5"
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="tab"
          aria-selected={value === opt.value}
          onClick={(): void => onChange(opt.value)}
          className={`${padding} font-medium rounded-lg transition-all duration-150 ${
            value === opt.value
              ? 'bg-surface-raised text-warm-800 shadow-sm'
              : 'text-warm-500 hover:text-warm-700'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

// ── Game type selector (colored) ─────────────

const GAME_COLORS: Record<GameType, string> = {
  kana: 'bg-sky-600 text-white shadow-sm',
  kotoba: 'bg-sage-500 text-white shadow-sm',
}

function GameTypeSelector({
  value,
  onChange,
}: {
  value: GameType
  onChange: (v: GameType) => void
}): ReactNode {
  return (
    <div
      role="tablist"
      aria-label="Game type"
      className="inline-flex bg-warm-100 rounded-xl p-1 gap-0.5"
    >
      {GAME_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="tab"
          aria-selected={value === opt.value}
          onClick={(): void => onChange(opt.value)}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-150 min-h-[44px] ${
            value === opt.value
              ? GAME_COLORS[opt.value]
              : 'text-warm-500 hover:text-warm-700'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

// ── Loading state ─────────────────────────────

function LoadingState(): ReactNode {
  return (
    <div className="bg-surface-raised rounded-2xl border border-border overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <div className="h-6 w-16 rounded bg-warm-200 animate-pulse" />
        <div className="h-3 w-28 rounded bg-warm-200 animate-pulse mt-1.5" />
      </div>
      <SkeletonRows />
    </div>
  )
}

// ── Main export ───────────────────────────────

export function LeaderboardClient(): ReactNode {
  const [kanaMode, setKanaMode] = useState<InputMode>('tap')
  const [kotobaMode, setKotobaMode] = useState<InputMode>('tap')
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('all-time')
  const [mobileGame, setMobileGame] = useState<GameType>('kana')
  const [isLoading] = useState(false)

  const kanaModeName = MODE_LABELS[kanaMode]
  const kotobaModeName = MODE_LABELS[kotobaMode]

  const kanaBoard = getLeaderboardFixture('kana', kanaMode, timePeriod)
  const kotobaBoard = getLeaderboardFixture('kotoba', kotobaMode, timePeriod)

  return (
    <div className="min-h-svh bg-surface">
      <AppTopBar />
      <div className="max-w-4xl mx-auto px-4 pt-20 pb-8">
        {/* Desktop: title + time period on same row */}
        <div className="hidden lg:flex items-center justify-between gap-3 mb-6">
          <h1 className="text-2xl font-bold text-warm-800">Leaderboard</h1>
          <PillSelector
            options={TIME_OPTIONS}
            value={timePeriod}
            onChange={setTimePeriod}
            ariaLabel="Time period"
          />
        </div>

        {/* Mobile: title, then controls row below */}
        <div className="lg:hidden mb-6">
          <h1 className="text-2xl font-bold text-warm-800 mb-4">Leaderboard</h1>
          <div className="flex items-center justify-between gap-3">
            <PillSelector
              options={TIME_OPTIONS}
              value={timePeriod}
              onChange={setTimePeriod}
              ariaLabel="Time period"
              size="small"
            />
            <GameTypeSelector value={mobileGame} onChange={setMobileGame} />
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <LoadingState />
            <div className="hidden lg:block">
              <LoadingState />
            </div>
          </div>
        ) : (
          <>
            {/* Desktop: side-by-side */}
            <div className="hidden lg:grid lg:grid-cols-2 gap-4">
              <LeaderboardList
                board={kanaBoard}
                variant="kana"
                modeName={kanaModeName}
                mode={kanaMode}
                onModeChange={setKanaMode}
              />
              <LeaderboardList
                board={kotobaBoard}
                variant="kotoba"
                modeName={kotobaModeName}
                mode={kotobaMode}
                onModeChange={setKotobaMode}
              />
            </div>

            {/* Mobile: single column with game switcher */}
            <div className="lg:hidden">
              {mobileGame === 'kana' ? (
                <LeaderboardList
                  board={kanaBoard}
                  variant="kana"
                  modeName={kanaModeName}
                  mode={kanaMode}
                  onModeChange={setKanaMode}
                />
              ) : (
                <LeaderboardList
                  board={kotobaBoard}
                  variant="kotoba"
                  modeName={kotobaModeName}
                  mode={kotobaMode}
                  onModeChange={setKotobaMode}
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
