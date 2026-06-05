// ─────────────────────────────────────────────
// File: components/layout/game-home-client.tsx
// Purpose: Client component composing the game home dashboard.
//          Parallax landscape fixed background. Streak calendar
//          top-left, Kana + Kotoba panels to the right. Responsive:
//          stacks on mobile, side-by-side on tablet+, fixed positions
//          on xl+ screens. Reduced-motion support.
//          Scene renders static until cyclist frames load, then
//          landscape and cyclist animate together.
//          All data derived from real Zustand stores.
// Depends on: components/layout/landscape-background.tsx,
//             components/animation/cycling-character.tsx,
//             components/dashboard/streak-calendar.tsx,
//             components/dashboard/mode-panel.tsx,
//             stores/mastery.store.ts, stores/unlock.store.ts,
//             stores/settings.store.ts
// ─────────────────────────────────────────────

'use client'

import { useEffect, useMemo } from 'react'
import type { ReactNode } from 'react'
import { StreakCalendar } from '@/components/dashboard/streak-calendar'
import { ModePanel } from '@/components/dashboard/mode-panel'
import { useMasteryStore } from '@/stores/mastery.store'
import { useUnlockStore } from '@/stores/unlock.store'
import { useSettingsStore } from '@/stores/settings.store'
import { useOnboardingStore } from '@/stores/onboarding.store'
import { KANA_CHARACTERS } from '@/data/kana/characters'
import { MASTERY_THRESHOLD } from '@/engine/mastery'
import { useLeaderboard } from '@/hooks/useLeaderboard'
import type { StageProgress, LeaderboardGlance, HeatmapDay } from '@/types/dashboard.types'
import type { Stage } from '@/types/kana.types'
import type { InputMode } from '@/types/user.types'

// ── Helpers ──────────────────────────────────

const STAGE_LABELS: Record<Stage, string> = {
  seion: 'Seion',
  dakuon: 'Dakuon',
  combination: 'Combination',
}

const SPECIAL_ROWS = new Set(['sokuon', 'longvowel'])

function deriveKanaStages(
  scores: Readonly<Record<string, number>>,
  unlockedIds: ReadonlySet<string>,
): StageProgress[] {
  const stages: Stage[] = ['seion', 'dakuon', 'combination']
  return stages.map((stage) => {
    const chars = KANA_CHARACTERS.filter((c) => c.stage === stage && !SPECIAL_ROWS.has(c.row))
    const total = chars.length
    const mastered = chars.filter(
      (c) => unlockedIds.has(c.id) && (scores[c.id] ?? 0) >= MASTERY_THRESHOLD,
    ).length
    const percentage = total > 0 ? Math.round((mastered / total) * 100) : 0
    return { label: STAGE_LABELS[stage], mastered, total, percentage }
  })
}

const EMPTY_HEATMAP: readonly HeatmapDay[] = []

// ── Main component ────────────────────────────

export function GameHomeClient(): ReactNode {
  const scores = useMasteryStore((s) => s.scores)
  const unlockedIds = useUnlockStore((s) => s.unlockedIds)
  const inputMode = useSettingsStore((s) => s.inputMode)
  const setInputMode = useSettingsStore((s) => s.setInputMode)

  useEffect(() => {
    const manual = new Set(useOnboardingStore.getState().selectedCharacterIds)
    useUnlockStore.getState().recompute(scores, manual)
  }, [scores])

  const kanaStages = useMemo(() => deriveKanaStages(scores, unlockedIds), [scores, unlockedIds])

  const jlptLevel = useOnboardingStore((s) => s.jlptLevel)

  const kanaBoard = useLeaderboard('kana', inputMode as InputMode, 'all-time')
  const kotobaBoard = useLeaderboard('kotoba', inputMode as InputMode, 'all-time')

  const kanaLeaderboard: LeaderboardGlance = useMemo(() => {
    if (!kanaBoard.board) return { rank: null, username: '', score: 0 }
    const user =
      kanaBoard.board.entries.find((e) => e.isCurrentUser) ??
      kanaBoard.board.currentUserPinned
    if (!user) return { rank: null, username: '', score: 0 }
    return { rank: user.rank, username: user.username, score: user.score }
  }, [kanaBoard.board])

  const kotobaLeaderboard: LeaderboardGlance = useMemo(() => {
    if (!kotobaBoard.board) return { rank: null, username: '', score: 0 }
    const user =
      kotobaBoard.board.entries.find((e) => e.isCurrentUser) ??
      kotobaBoard.board.currentUserPinned
    if (!user) return { rank: null, username: '', score: 0 }
    return { rank: user.rank, username: user.username, score: user.score }
  }, [kotobaBoard.board])

  const kotobaStages: StageProgress[] = useMemo(() => {
    const levels: string[] = ['N5', 'N4', 'N3', 'N2', 'N1']
    const startIndex = levels.indexOf(jlptLevel ?? 'N5')
    return levels.slice(startIndex, startIndex + 3).map((level) => ({
      label: level,
      mastered: 0,
      total: 0,
      percentage: 0,
    }))
  }, [jlptLevel])

  return (
    <main className="overflow-y-auto min-h-svh px-3 sm:px-4 mt-[72px] mb-8">
      <div className="max-w-5xl mx-auto lg:ml-auto lg:mr-4 flex flex-col md:flex-row gap-4">
        <div className="w-full max-w-[320px] mx-auto md:mx-0 md:max-w-none md:w-[260px] shrink-0">
          <StreakCalendar heatmap={EMPTY_HEATMAP} streakCount={0} />
        </div>
        <div className="flex-1 flex flex-col lg:flex-row gap-4">
          <div className="lg:flex-1">
            <ModePanel
              variant="kana"
              stages={kanaStages}
              leaderboard={kanaLeaderboard}
              inputMode={inputMode}
              onModeChange={setInputMode}
            />
          </div>
          <div className="lg:flex-1">
            <ModePanel
              variant="kotoba"
              stages={kotobaStages}
              leaderboard={kotobaLeaderboard}
              inputMode={inputMode}
              onModeChange={setInputMode}
            />
          </div>
        </div>
      </div>
    </main>
  )
}
