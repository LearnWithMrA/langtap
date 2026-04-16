// ------------------------------------------------------------
// File: components/game/input-field.tsx
// Purpose: Text input for Type and Swipe modes. Accepts romaji
//          keyboard input. Border colour flashes green/orange
//          based on feedback state. Auto-focuses on mount.
// Depends on: hooks/useKeySound.ts
// ------------------------------------------------------------

'use client'

import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { useKeySound } from '@/hooks/useKeySound'

// -- Types --------------------------------------------------

type FeedbackState = 'idle' | 'correct' | 'wrong'

type InputFieldProps = {
  value: string
  onChange: (value: string) => void
  feedbackState: FeedbackState
  disabled: boolean
}

// -- Constants ----------------------------------------------

const BORDER_CLASSES: Record<FeedbackState, string> = {
  idle: 'border-border focus:ring-sage-300',
  correct: 'border-feedback-correct ring-2 ring-feedback-correct',
  wrong: 'border-feedback-wrong ring-2 ring-feedback-wrong',
}

// -- Component ----------------------------------------------

export function InputField({ value, onChange, feedbackState, disabled }: InputFieldProps): ReactNode {
  const inputRef = useRef<HTMLInputElement>(null)
  const { playSound } = useKeySound()

  useEffect((): void => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus()
    }
  }, [disabled, value])

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e): void => {
        const newVal = e.target.value
        const lastChar = newVal.slice(-1).toLowerCase()
        if (lastChar && newVal.length > value.length) {
          playSound(lastChar)
        }
        onChange(newVal)
      }}
      disabled={disabled}
      placeholder="Type here..."
      autoComplete="off"
      autoCorrect="off"
      spellCheck={false}
      aria-label="Type the romaji for the displayed character"
      className={[
        'w-full rounded-xl border-2 bg-surface-raised px-4 py-3',
        'text-center text-xl text-warm-800',
        'focus:outline-none focus:ring-2',
        'transition-colors duration-150',
        'placeholder:text-warm-400',
        'disabled:opacity-50',
        BORDER_CLASSES[feedbackState],
      ].join(' ')}
    />
  )
}
