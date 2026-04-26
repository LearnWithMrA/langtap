// ------------------------------------------------------------
// File: components/layout/practice-client.tsx
// Purpose: Client component composing the full practice screen.
//          Layers the parallax landscape, mascot, top bar,
//          distance counter with mode selector, game window, and
//          audio player into a full-viewport scene. Swipe mode
//          uses a compact layout preset (hides mascot and top bar).
// Depends on: components/layout/LandscapeBackground.tsx,
//             components/animation/cycling-character.tsx,
//             components/layout/app-top-bar.tsx,
//             components/game/game-window.tsx,
//             components/game/distance-counter.tsx,
//             components/audio/audio-player.tsx
// ------------------------------------------------------------

'use client'

import { useCallback, useState } from 'react'
import type { ReactNode } from 'react'
import { useSearchParams } from 'next/navigation'
import { useReducedMotion } from 'motion/react'
import { LandscapeBackground } from '@/components/layout/landscape-background'
import { CyclingCharacter } from '@/components/animation/cycling-character'
import { AppTopBar } from '@/components/layout/app-top-bar'
import { GameWindow } from '@/components/game/game-window'
import { KotobaGameWindow } from '@/components/game/kotoba-game-window'
import { DistanceCounter } from '@/components/game/distance-counter'
import { AudioPlayer } from '@/components/audio/audio-player'
import { useKeySound } from '@/hooks/useKeySound'
import { usePracticeCounters } from '@/hooks/usePracticeCounters'
import { useSettingsStore } from '@/stores/settings.store'

// -- Types --------------------------------------------------

type InputMode = 'type' | 'tap' | 'swipe'
type GameType = 'kana' | 'kotoba'

const ALL_MODES: InputMode[] = ['tap', 'type', 'swipe']

const MODE_LABELS: Record<InputMode, string> = {
  type: 'Type',
  tap: 'Tap',
  swipe: 'Swipe',
}

// -- Mode dropdown ------------------------------------------

function ModeDropdown({
  mode,
  onModeChange,
  gameType,
}: {
  mode: InputMode
  onModeChange: (m: InputMode) => void
  gameType: GameType
}): ReactNode {
  const [isOpen, setIsOpen] = useState(false)
  const { playSound } = useKeySound()
  const label = gameType === 'kana' ? 'Kana' : 'Kotoba'

  return (
    <div className="relative">
      <button
        type="button"
        onClick={(): void => {
          playSound('ui-dropdown')
          setIsOpen(!isOpen)
        }}
        className="text-sm font-bold text-warm-800 hover:text-sage-400 transition-colors duration-150 cursor-pointer translate-y-0"
        aria-label={`Current mode: ${label} ${MODE_LABELS[mode]}. Click to change.`}
        aria-expanded={isOpen}
      >
        {label} {MODE_LABELS[mode]} ▾
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg py-1 min-w-[120px] z-50">
          {ALL_MODES.map((m) => (
            <button
              key={m}
              type="button"
              onClick={(): void => {
                playSound('ui-mode-switch')
                onModeChange(m)
                setIsOpen(false)
              }}
              className={[
                'w-full text-left px-3 py-1.5 text-sm transition-colors duration-150 cursor-pointer',
                m === mode
                  ? 'text-sage-500 font-bold'
                  : 'text-warm-800 hover:text-sage-400 hover:bg-sage-50',
              ].join(' ')}
            >
              {MODE_LABELS[m]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// -- Component ----------------------------------------------

export function PracticeClient(): ReactNode {
  const searchParams = useSearchParams()
  const gameType = (searchParams.get('mode') === 'kotoba' ? 'kotoba' : 'kana') as GameType
  const [mode, setMode] = useState<InputMode>('tap')
  const kotobaInput = useSettingsStore((s) => s.kotobaInput)
  const prefersReducedMotion = useReducedMotion()
  const { counters, incrementCorrect } = usePracticeCounters()

  const sceneSpeed = prefersReducedMotion ? 'stopped' : 'idle'

  const handleCharacterCorrect = useCallback((): void => {
    incrementCorrect(mode)
  }, [incrementCorrect, mode])

  return (
    <div className="theme-day relative w-full h-svh overflow-hidden">
      {/* Parallax landscape */}
      <LandscapeBackground speed={sceneSpeed} staticHills={prefersReducedMotion ?? false} />

      <div
        className="absolute bottom-[calc(12svh-max(7.73vw,62.7px))] left-[3%] md:left-[8%] z-[3]"
        aria-hidden="true"
      >
        <CyclingCharacter speed={sceneSpeed} />
      </div>

      {/* Top bar */}
      <AppTopBar />

      {/* Audio player: bottom right */}
      <div className="absolute bottom-4 right-4 z-10">
        <AudioPlayer />
      </div>

      {/* Game window: centred, raised 40% */}
      <div className="absolute left-1/2 -translate-x-1/2 top-[34%] -translate-y-1/2 z-10 w-full max-w-lg px-4">
        {gameType === 'kotoba' ? (
          <KotobaGameWindow
            mode={mode}
            kotobaInput={kotobaInput}
            onCharacterCorrect={handleCharacterCorrect}
          >
            <ModeDropdown mode={mode} onModeChange={setMode} gameType="kotoba" />
            <DistanceCounter value={counters[mode]} />
          </KotobaGameWindow>
        ) : (
          <GameWindow mode={mode} onCharacterCorrect={handleCharacterCorrect}>
            <ModeDropdown mode={mode} onModeChange={setMode} gameType="kana" />
            <DistanceCounter value={counters[mode]} />
          </GameWindow>
        )}
      </div>
    </div>
  )
}
