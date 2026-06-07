// ─────────────────────────────────────────────
// File: components/layout/game-home-client.tsx
// Purpose: Client component composing the game home dashboard.
//          Parallax landscape fixed background. Streak calendar
//          top-left, Kana + Kotoba panels to the right. Responsive:
//          stacks on mobile, side-by-side on tablet+, fixed positions
//          on xl+ screens. Reduced-motion support.
//          Scene renders static until cyclist frames load, then
//          landscape and cyclist animate together.
//          Guests see demo fixture data. Authenticated users see
//          real Zustand store data.
// Depends on: components/layout/landscape-background.tsx,
//             components/animation/cycling-character.tsx,
//             components/dashboard/streak-calendar.tsx,
//             components/dashboard/mode-panel.tsx,
//             stores/mastery.store.ts, stores/unlock.store.ts,
//             stores/settings.store.ts,
//             data/demo/demo-mastery.ts, hooks/useAuth.ts
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
import { useStreak } from '@/hooks/useStreak'
import { useAuth } from '@/hooks/useAuth'
import { useDialogueSeen } from '@/hooks/useDialogueSeen'
import { DIALOGUE_SCRIPTS } from '@/data/tutorial/dialogue-scripts'
import { DialogueOverlay } from '@/components/game/dialogue-overlay'
import { DEMO_KANA_MASTERY_SCORES } from '@/data/demo/demo-mastery'
import { getDashboardFixture } from '@/fixtures/samples/dashboard-fixtures'
import type { StageProgress, LeaderboardGlance } from '@/types/dashboard.types'
import type { Stage } from '@/types/kana.types'
import type { InputMode } from '@/types/user.types'

// ── Helpers ──────────────────────────────────

const STAGE_LABELS: Record<Stage, string> = {
  seion: 'Seion',
  dakuon: 'Dakuon',
  combination: 'Combination',
}

const SPECIAL_ROWS = new Set(['sokuon', 'longvowel'])

// ── Demo fixtures ───────────────────────────
// Reuse the MID dashboard fixture for a realistic demo home.

const DEMO_DASHBOARD = getDashboardFixture('mid')
const DEMO_HEATMAP = DEMO_DASHBOARD.heatmap
const DEMO_STREAK_COUNT = DEMO_DASHBOARD.streak.streakChainDays

const DEMO_KANA_UNLOCKED_IDS = new Set(Object.keys(DEMO_KANA_MASTERY_SCORES))

const DEMO_LEADERBOARD: LeaderboardGlance = { rank: null, username: '', score: 0 }

const DEMO_KOTOBA_STAGES: readonly StageProgress[] = DEMO_DASHBOARD.kotobaStages

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

// ── Main component ────────────────────────────

export function GameHomeClient(): ReactNode {
  const { isGuest } = useAuth()
  const scores = useMasteryStore((s) => s.scores)
  const unlockedIds = useUnlockStore((s) => s.unlockedIds)
  const inputMode = useSettingsStore((s) => s.inputMode)
  const setInputMode = useSettingsStore((s) => s.setInputMode)
  const { heatmap, streakCount, isLoading: streakLoading } = useStreak()

  useEffect(() => {
    if (isGuest) return
    const manual = new Set(useOnboardingStore.getState().selectedCharacterIds)
    useUnlockStore.getState().recompute(scores, manual)
  }, [scores, isGuest])

  const realKanaStages = useMemo(() => deriveKanaStages(scores, unlockedIds), [scores, unlockedIds])
  const demoKanaStages = useMemo(
    () => deriveKanaStages(DEMO_KANA_MASTERY_SCORES, DEMO_KANA_UNLOCKED_IDS),
    [],
  )

  const jlptLevel = useOnboardingStore((s) => s.jlptLevel)

  // Skip leaderboard RPCs for guests since they see DEMO_LEADERBOARD
  const kanaBoard = useLeaderboard('kana', inputMode as InputMode, 'all-time')
  const kotobaBoard = useLeaderboard('kotoba', inputMode as InputMode, 'all-time')

  const kanaLeaderboard: LeaderboardGlance = useMemo(() => {
    if (isGuest) return DEMO_LEADERBOARD
    if (!kanaBoard.board) return { rank: null, username: '', score: 0 }
    const user =
      kanaBoard.board.entries.find((e) => e.isCurrentUser) ?? kanaBoard.board.currentUserPinned
    if (!user) return { rank: null, username: '', score: 0 }
    return { rank: user.rank, username: user.username, score: user.score }
  }, [kanaBoard.board, isGuest])

  const kotobaLeaderboard: LeaderboardGlance = useMemo(() => {
    if (isGuest) return DEMO_LEADERBOARD
    if (!kotobaBoard.board) return { rank: null, username: '', score: 0 }
    const user =
      kotobaBoard.board.entries.find((e) => e.isCurrentUser) ?? kotobaBoard.board.currentUserPinned
    if (!user) return { rank: null, username: '', score: 0 }
    return { rank: user.rank, username: user.username, score: user.score }
  }, [kotobaBoard.board, isGuest])

  const realKotobaStages: StageProgress[] = useMemo(() => {
    const levels: string[] = ['N5', 'N4', 'N3', 'N2', 'N1']
    const startIndex = levels.indexOf(jlptLevel ?? 'N5')
    return levels.slice(startIndex, startIndex + 3).map((level) => ({
      label: level,
      mastered: 0,
      total: 0,
      percentage: 0,
    }))
  }, [jlptLevel])

  const kanaStages = isGuest ? demoKanaStages : realKanaStages
  const kotobaStages = isGuest ? DEMO_KOTOBA_STAGES : realKotobaStages
  const displayHeatmap = isGuest ? DEMO_HEATMAP : heatmap
  const displayStreakCount = isGuest ? DEMO_STREAK_COUNT : streakCount
  const displayKanaLeaderboard = isGuest ? DEMO_LEADERBOARD : kanaLeaderboard
  const displayKotobaLeaderboard = isGuest ? DEMO_LEADERBOARD : kotobaLeaderboard
  const kanaRoute = isGuest ? '/demo/kana' : undefined
  const kotobaRoute = isGuest ? '/demo/kotoba' : undefined

  const { hasSeen: hasSeenDemoHome, markSeen: markDemoHomeSeen } = useDialogueSeen('demo-home')
  const showDemoHomeDialogue = isGuest && !hasSeenDemoHome

  const { hasSeen: hasSeenFlamePrompt, markSeen: markFlamePromptSeen } =
    useDialogueSeen('home-flame-prompt')
  const showFlamePrompt = !isGuest && !hasSeenFlamePrompt

  return (
    <main className="overflow-y-auto min-h-svh px-3 sm:px-4 mt-[72px] mb-8">
      {showDemoHomeDialogue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-warm-800/40" />
          <div className="relative w-full max-w-lg">
            <DialogueOverlay
              messages={DIALOGUE_SCRIPTS['demo-home'].messages}
              mascotPose={DIALOGUE_SCRIPTS['demo-home'].mascotPose}
              theme="blue"
              onDismiss={markDemoHomeSeen}
            />
          </div>
        </div>
      )}
      {showFlamePrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-warm-800/40" />
          <div className="relative w-full max-w-lg">
            <DialogueOverlay
              messages={DIALOGUE_SCRIPTS['home-flame-prompt'].messages}
              mascotPose={DIALOGUE_SCRIPTS['home-flame-prompt'].mascotPose}
              theme="blue"
              onDismiss={markFlamePromptSeen}
            />
          </div>
        </div>
      )}
      <div className="max-w-5xl mx-auto lg:ml-auto lg:mr-4 flex flex-col md:flex-row gap-4">
        <div className="w-full max-w-[320px] mx-auto md:mx-0 md:max-w-none md:w-[260px] shrink-0">
          {!isGuest && streakLoading ? (
            <div className="bg-white/60 backdrop-blur-md rounded-2xl shadow-lg px-3 py-4 animate-pulse">
              <div className="h-4 w-24 bg-warm-200 rounded mx-auto mb-3" />
              <div className="grid grid-cols-7 gap-1.5">
                {Array.from({ length: 35 }, (_, i) => (
                  <div key={i} className="w-6 h-6 rounded-full bg-warm-200" />
                ))}
              </div>
            </div>
          ) : (
            <StreakCalendar heatmap={displayHeatmap} streakCount={displayStreakCount} />
          )}
        </div>
        <div className="flex-1 flex flex-col lg:flex-row gap-4">
          <div className="lg:flex-1">
            <ModePanel
              variant="kana"
              stages={kanaStages}
              leaderboard={displayKanaLeaderboard}
              inputMode={inputMode}
              onModeChange={setInputMode}
              routeOverride={kanaRoute}
            />
          </div>
          <div className="lg:flex-1">
            <ModePanel
              variant="kotoba"
              stages={kotobaStages}
              leaderboard={displayKotobaLeaderboard}
              inputMode={inputMode}
              onModeChange={setInputMode}
              routeOverride={kotobaRoute}
            />
          </div>
        </div>
      </div>
    </main>
  )
}
