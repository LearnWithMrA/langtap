// ------------------------------------------------------------
// File: components/game/tap-input.tsx
// Purpose: On-screen character button grid for Tap mode.
//          Buttons show either romaji or kana depending on the
//          direction prop. Each button is keyboard-key style with
//          3D shadow. Correct taps flash green, wrong flash orange.
// Depends on: hooks/useKeySound.ts
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

type TapInputProps = {
  characters: TapCharacter[]
  displayField: 'kana' | 'romaji'
  onTap: (id: string, value: string) => void
  feedbackId: string | null
  feedbackState: 'correct' | 'wrong' | null
  variant?: 'sage' | 'sky'
}

// -- Component ----------------------------------------------

export function TapInput({
  characters,
  displayField,
  onTap,
  feedbackId,
  feedbackState,
  variant = 'sage',
}: TapInputProps): ReactNode {
  const { playSound } = useKeySound()

  const colours = variant === 'sky'
    ? { idle: 'bg-sky-100 shadow-[0_3px_0_0_var(--color-sky-300)]', correct: 'bg-sky-400 shadow-[0_3px_0_0_var(--color-sky-600)]' }
    : { idle: 'bg-sage-100 shadow-[0_3px_0_0_var(--color-sage-300)]', correct: 'bg-sage-400 shadow-[0_3px_0_0_var(--color-sage-500)]' }

  const handleTap = useCallback(
    (id: string, value: string, soundId: string): void => {
      playSound(soundId)
      onTap(id, value)
    },
    [onTap, playSound],
  )

  return (
    <div className="grid grid-cols-5 gap-2 pt-3" role="group" aria-label="Character selection grid">
      {characters.map((char, index) => {
        const tapSoundId = index % 2 === 0 ? 'e' : 'o'
        const displayText = displayField === 'romaji' ? char.romaji : char.kana
        const tapValue = displayField === 'romaji' ? char.romaji : char.kana
        const isFeedback = feedbackId === char.id
        let bgClass = colours.idle
        if (isFeedback && feedbackState === 'correct') {
          bgClass = colours.correct
        } else if (isFeedback && feedbackState === 'wrong') {
          bgClass = 'bg-feedback-wrong shadow-[0_3px_0_0_#c47a3a]'
        }

        return (
          <button
            key={char.id}
            type="button"
            onClick={(): void => handleTap(char.id, tapValue, tapSoundId)}
            aria-label={displayText}
            className={[
              'flex flex-col items-center justify-center',
              'min-h-11 min-w-11 rounded-xl',
              'transition-all duration-75',
              'active:translate-y-[3px] active:shadow-none',
              'focus:outline-none',
              'cursor-pointer',
              bgClass,
            ].join(' ')}
          >
            <span className="text-lg font-medium text-warm-800">{displayText}</span>
          </button>
        )
      })}
    </div>
  )
}
