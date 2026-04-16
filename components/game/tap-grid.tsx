// ------------------------------------------------------------
// File: components/game/tap-grid.tsx
// Purpose: On-screen kana character button grid for Tap mode.
//          Each button is keyboard-key style with 3D shadow.
//          Correct taps flash green, wrong taps flash orange.
// Depends on: nothing
// ------------------------------------------------------------

'use client'

import { useCallback } from 'react'
import type { ReactNode } from 'react'
import { useKeySound } from '@/hooks/useKeySound'

// -- Types --------------------------------------------------

type TapCharacter = {
  id: string
  kana: string
  romaji: string
}

type TapGridProps = {
  characters: TapCharacter[]
  onTap: (id: string, romaji: string) => void
  feedbackId: string | null
  feedbackState: 'correct' | 'wrong' | null
}

// -- Component ----------------------------------------------

export function TapGrid({ characters, onTap, feedbackId, feedbackState }: TapGridProps): ReactNode {
  const { playSound } = useKeySound()

  const handleTap = useCallback((id: string, romaji: string): void => {
    playSound(romaji)
    onTap(id, romaji)
  }, [onTap, playSound])

  return (
    <div
      className="grid grid-cols-5 gap-2 pt-3"
      role="group"
      aria-label="Character selection grid"
    >
      {characters.map((char) => {
        const isFeedback = feedbackId === char.id
        let bgClass = 'bg-sage-100 shadow-[0_3px_0_0_var(--color-sage-300)]'
        if (isFeedback && feedbackState === 'correct') {
          bgClass = 'bg-sage-400 shadow-[0_3px_0_0_var(--color-sage-500)]'
        } else if (isFeedback && feedbackState === 'wrong') {
          bgClass = 'bg-feedback-wrong shadow-[0_3px_0_0_#c47a3a]'
        }

        return (
          <button
            key={char.id}
            type="button"
            onClick={(): void => handleTap(char.id, char.romaji)}
            aria-label={char.romaji}
            className={[
              'flex flex-col items-center justify-center',
              'min-h-11 min-w-11 rounded-xl',
              'transition-all duration-75',
              'active:translate-y-[3px] active:shadow-none',
              'focus:outline-none focus:ring-2 focus:ring-sage-300',
              'cursor-pointer',
              bgClass,
            ].join(' ')}
          >
            <span className="text-base font-medium text-warm-800">{char.romaji}</span>
          </button>
        )
      })}
    </div>
  )
}
