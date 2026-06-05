// ─────────────────────────────────────────────
// File: components/layout/demo-practice-client.tsx
// Purpose: Client component for the demo taster experience. Stripped
//          down from PracticeClient: no auth, no guest usage, no
//          daily cap, no tutorial dialogues, no leaderboard sessions,
//          no server writes. Uses demo session hooks that read from
//          a fixed prompt set sequentially. Shows a welcome dialogue
//          on first visit, then practice, then a completion screen
//          with a sign-up CTA.
// Depends on: components/game/game-window.tsx,
//             components/game/dialogue-overlay.tsx,
//             hooks/useDemoKanaPracticeSession.ts,
//             hooks/useDemoKotobaPracticeSession.ts,
//             stores/demo.store.ts
// ─────────────────────────────────────────────

'use client'

import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { GameWindow } from '@/components/game/game-window'
import { DialogueOverlay } from '@/components/game/dialogue-overlay'
import { DistanceCounter } from '@/components/game/distance-counter'
import { useDemoKanaPracticeSession } from '@/hooks/useDemoKanaPracticeSession'
import { useDemoKotobaPracticeSession } from '@/hooks/useDemoKotobaPracticeSession'
import { useDemoStore } from '@/stores/demo.store'
import { useSettingsStore } from '@/stores/settings.store'
import { useAuthModalStore } from '@/stores/auth-modal.store'
import { DEMO_ALLOWED_IDS } from '@/data/demo/demo-prompts'

const LazyKotobaGameWindow = dynamic(
  () =>
    import('@/components/game/kotoba-game-window').then((mod) => ({
      default: mod.KotobaGameWindow,
    })),
  { loading: () => null },
)

const DEMO_ALLOWED_SET = new Set(DEMO_ALLOWED_IDS)

// ── Types ────────────────────────────────────

type InputMode = 'type' | 'tap' | 'swipe'
type GameType = 'kana' | 'kotoba'

const ALL_MODES: InputMode[] = ['tap', 'type', 'swipe']

const MODE_LABELS: Record<InputMode, string> = {
  type: 'Type',
  tap: 'Tap',
  swipe: 'Swipe',
}

const DEMO_WELCOME_MESSAGES: string[] = [
  'Welcome to the taster! This is a mini version of LangTap.',
  'The full game teaches you and introduces new content bit by bit.',
  'For now, just click away and explore. If you don\'t know the answer, just guess and the game will guide you.',
  'Explore different input modes, kotoba mode, the home page and more. Or sign up to jump right in!',
]

// ── Mode dropdown ────────────────────────────

function ModeDropdown({
  mode,
  onModeChange,
  gameType,
}: {
  mode: InputMode
  onModeChange: (m: InputMode) => void
  gameType: GameType
}): ReactNode {
  return (
    <div className="relative">
      <select
        value={mode}
        onChange={(e): void => onModeChange(e.target.value as InputMode)}
        className="appearance-none bg-transparent text-warm-600 text-sm font-medium pr-5 cursor-pointer focus:outline-none"
        aria-label={`${gameType === 'kana' ? 'Kana' : 'Kotoba'} input mode`}
      >
        {ALL_MODES.map((m) => (
          <option key={m} value={m}>
            {MODE_LABELS[m]}
          </option>
        ))}
      </select>
      <span className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-warm-400 text-xs">
        ▾
      </span>
    </div>
  )
}

// ── Practice scene layout ────────────────────

function DemoPracticeScene({
  children,
  hasBanner,
}: {
  children: ReactNode
  hasBanner?: boolean
}): ReactNode {
  return (
    <div className="h-svh overflow-hidden">
      <div
        className={[
          'absolute left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-full max-w-lg px-4',
          hasBanner ? 'top-[40%]' : 'top-[34%]',
        ].join(' ')}
      >
        {children}
      </div>
    </div>
  )
}

// ── Completion screen ────────────────────────

const DEMO_COMPLETED_KEY = 'langtap-demo-completed'

export function hasDemoBeenCompleted(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(DEMO_COMPLETED_KEY) === '1'
}

function DemoCompletionCard({ gameType }: { gameType: GameType }): ReactNode {
  const openSignUp = useAuthModalStore((s) => s.openSignUp)

  useEffect(() => {
    localStorage.setItem(DEMO_COMPLETED_KEY, '1')
  }, [])
  const otherType = gameType === 'kana' ? 'kotoba' : 'kana'
  const otherLabel = gameType === 'kana' ? 'Kotoba' : 'Kana'
  const otherRoute = `/demo/${otherType}`
  const isOtherComplete = useDemoStore(
    (s) => (otherType === 'kana' ? s.isKanaComplete : s.isKotobaComplete),
  )

  return (
    <DemoPracticeScene>
      <div className="bg-[#faf5e4] shadow-[0_6px_0_0_#d4c9b0] rounded-2xl w-full max-w-md mx-auto p-6 md:p-8 text-center">
        <p className="text-2xl font-bold text-warm-800 mb-3">
          {"That's the taster!"}
        </p>
        <p className="text-base text-warm-600 mb-6">
          Sign up to keep practising and track your progress.
        </p>
        <button
          type="button"
          onClick={openSignUp}
          className="w-full bg-sage-500 hover:bg-sage-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors mb-3"
          aria-label="Sign up to continue"
        >
          Sign up
        </button>
        {!isOtherComplete && (
          <Link
            href={otherRoute}
            className="inline-block text-sm text-sage-500 hover:text-sage-600 font-medium mt-2"
          >
            Try {otherLabel} mode
          </Link>
        )}
      </div>
    </DemoPracticeScene>
  )
}

// ── Main component ───────────────────────────

export function DemoPracticeClient({ gameType = 'kana' }: { gameType?: GameType }): ReactNode {
  const mode = useSettingsStore((s) => s.inputMode) as InputMode
  const setMode = useSettingsStore((s) => s.setInputMode)
  const kotobaInput = useSettingsStore((s) => s.kotobaInput)
  const activate = useDemoStore((s) => s.activate)
  const isKanaComplete = useDemoStore((s) => s.isKanaComplete)
  const isKotobaComplete = useDemoStore((s) => s.isKotobaComplete)

  const kanaSession = useDemoKanaPracticeSession()
  const kotobaSession = useDemoKotobaPracticeSession()

  const [showWelcome, setShowWelcome] = useState(true)

  useEffect(() => {
    activate()
  }, [activate])

  const handleWelcomeDismiss = useCallback((): void => {
    setShowWelcome(false)
  }, [])

  const isComplete = gameType === 'kana' ? isKanaComplete : isKotobaComplete

  if (isComplete) {
    return <DemoCompletionCard gameType={gameType} />
  }

  if (showWelcome) {
    return (
      <DemoPracticeScene>
        <DialogueOverlay
          messages={DEMO_WELCOME_MESSAGES}
          mascotPose="neutral"
          theme={gameType === 'kana' ? 'blue' : 'green'}
          onDismiss={handleWelcomeDismiss}
        />
      </DemoPracticeScene>
    )
  }

  if (gameType === 'kotoba') {
    return (
      <DemoPracticeScene>
        <LazyKotobaGameWindow
          mode={mode}
          kotobaInput={kotobaInput}
          session={kotobaSession}
        >
          <ModeDropdown mode={mode} onModeChange={setMode} gameType="kotoba" />
          <span className="text-xs font-semibold text-sage-500 tracking-wider uppercase">
            Demo
          </span>
        </LazyKotobaGameWindow>
      </DemoPracticeScene>
    )
  }

  return (
    <DemoPracticeScene>
      <GameWindow
        mode={mode}
        session={kanaSession}
        allowedCharIds={DEMO_ALLOWED_SET}
      >
        <ModeDropdown mode={mode} onModeChange={setMode} gameType="kana" />
        <span className="text-xs font-semibold text-sage-500 tracking-wider uppercase">Demo</span>
      </GameWindow>
    </DemoPracticeScene>
  )
}
