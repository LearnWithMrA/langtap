// ─────────────────────────────────────────────
// File: components/layout/game-home-client.tsx
// Purpose: Client component composing the game home dashboard.
//          Parallax landscape fixed background. Streak calendar
//          top-left, Kana + Kotoba panels to the right. Responsive:
//          stacks on mobile, side-by-side on tablet+, fixed positions
//          on xl+ screens. Reduced-motion support.
//          All data from mock fixtures (Sprint 2B visual shell).
// Depends on: components/layout/LandscapeBackground.tsx,
//             components/animation/cycling-character.tsx,
//             components/layout/app-top-bar.tsx,
//             components/dashboard/streak-calendar.tsx,
//             components/dashboard/mode-panel.tsx,
//             samples/dashboard-fixtures.ts
// ─────────────────────────────────────────────

'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import { useReducedMotion } from 'motion/react'
import { LandscapeBackground } from '@/components/layout/landscape-background'
import { CyclingCharacter } from '@/components/animation/cycling-character'
import { AppTopBar } from '@/components/layout/app-top-bar'
import { StreakCalendar } from '@/components/dashboard/streak-calendar'
import { ModePanel } from '@/components/dashboard/mode-panel'
import type { DashboardFixtureKey } from '@/samples/dashboard-fixtures'
import { getDashboardFixture } from '@/samples/dashboard-fixtures'

// ── Main component ────────────────────────────

export function GameHomeClient(): ReactNode {
  const prefersReducedMotion = useReducedMotion()
  const [fixtureKey, setFixtureKey] = useState<DashboardFixtureKey>('mid')
  const data = getDashboardFixture(fixtureKey)

  const sceneSpeed = prefersReducedMotion ? 'stopped' : 'idle'
  const mascotSpeed = prefersReducedMotion ? 'stopped' : 'idle'

  return (
    <div className="theme-day relative w-full min-h-svh overflow-y-auto">
      {/* Fixed parallax landscape background */}
      <div className="fixed inset-0 z-0">
        <LandscapeBackground speed={sceneSpeed} staticHills={prefersReducedMotion ?? false} />
        <div
          className="absolute bottom-[calc(12svh-max(7.73vw,62.7px))] -left-[1%] md:left-[3%] z-[3]"
          aria-hidden="true"
        >
          <CyclingCharacter speed={mascotSpeed} />
        </div>
      </div>

      {/* Top bar */}
      <AppTopBar />

      {/* Dashboard content - responsive flow layout */}
      <main className="relative z-10 px-3 sm:px-4 mt-[72px] mb-8">
        <div className="max-w-5xl mx-auto lg:ml-auto lg:mr-4 flex flex-col md:flex-row gap-4">
          {/* Calendar */}
          <div className="w-full max-w-[320px] mx-auto md:mx-0 md:max-w-none md:w-[260px] shrink-0">
            <StreakCalendar heatmap={data.heatmap} streakCount={data.streak.streakChainDays} />
          </div>

          {/* Kana and Kotoba panels - stacked on mobile+tablet, side by side on lg+ */}
          <div className="flex-1 flex flex-col lg:flex-row gap-4">
            <div className="lg:flex-1">
              <ModePanel
                variant="kana"
                stages={data.stages}
                leaderboard={data.leaderboard}
                inputMode={data.inputMode}
              />
            </div>
            <div className="lg:flex-1">
              <ModePanel
                variant="kotoba"
                stages={data.kotobaStages}
                leaderboard={data.kotobaLeaderboard}
                inputMode={data.inputMode}
                locked={data.kotobaLocked}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Fixture selector (dev only, pinned to bottom) */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-4 py-2">
        <span className="text-xs text-white/70">Fixture:</span>
        {(['zero', 'mid', 'advanced'] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={(): void => setFixtureKey(key)}
            className={`text-xs px-2 py-1 rounded-lg transition-colors duration-150 ${
              fixtureKey === key
                ? 'bg-white/80 text-warm-700 font-medium'
                : 'text-white/60 hover:bg-white/30'
            }`}
          >
            {key}
          </button>
        ))}
      </div>
    </div>
  )
}
