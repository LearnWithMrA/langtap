// ------------------------------------------------------------
// File: components/game/swipe-input.tsx
// Purpose: Text input for Swipe mode. Accepts raw swipe-keyboard
//          input without the zero-width-space IME trick used by
//          TypeInput (that trick breaks swipe keyboards — they
//          commit whole words, duplicate characters, and lose
//          backspace). Still renders a katakana overlay when the
//          current word is katakana so the user sees the correct
//          script even though the swipe keyboard only offers
//          hiragana. Border colour flashes green/orange based on
//          feedback state. Auto-focuses on mount.
// Depends on: hooks/useKeySound.ts
// ------------------------------------------------------------

'use client'

import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { useKeySound } from '@/hooks/useKeySound'

// -- Types --------------------------------------------------

type FeedbackState = 'idle' | 'correct' | 'wrong'

type SwipeInputProps = {
  value: string
  onChange: (value: string) => void
  feedbackState: FeedbackState
  disabled: boolean
  showKatakana?: boolean
}

// -- Helpers ------------------------------------------------

/** Convert hiragana characters to katakana (fixed Unicode offset of 0x60) */
function toKatakana(str: string): string {
  return str.replace(/[\u3040-\u309F]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) + 0x60))
}

// -- Constants ----------------------------------------------

const BORDER_CLASSES: Record<FeedbackState, string> = {
  idle: 'border-border focus:ring-sage-300',
  correct: 'border-feedback-correct ring-2 ring-feedback-correct',
  wrong: 'border-feedback-wrong ring-2 ring-feedback-wrong',
}

// -- Component ----------------------------------------------

export function SwipeInput({
  value,
  onChange,
  feedbackState,
  disabled,
  showKatakana = false,
}: SwipeInputProps): ReactNode {
  const displayValue = showKatakana ? toKatakana(value) : value
  const inputRef = useRef<HTMLInputElement>(null)
  const { playSound } = useKeySound()

  useEffect((): void => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus()
    }
  }, [disabled, value])

  const fieldClasses = [
    'w-full rounded-xl border-2 bg-surface-raised px-4 py-3',
    'text-center text-xl',
    'focus:outline-none focus:ring-2',
    'transition-colors duration-150',
    'placeholder:text-warm-400',
    'disabled:opacity-50',
    BORDER_CLASSES[feedbackState],
  ].join(' ')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const newVal = e.target.value
    const lastChar = newVal.slice(-1)
    if (lastChar && newVal.length > value.length) {
      playSound(lastChar.toLowerCase())
    }
    onChange(newVal)
  }

  if (showKatakana) {
    return (
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          disabled={disabled}
          placeholder=""
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          aria-label="Swipe the hiragana, displayed as katakana"
          className={[fieldClasses, 'text-transparent caret-warm-800'].join(' ')}
        />
        <div
          className="absolute inset-0 flex items-center justify-center text-xl text-warm-800 pointer-events-none px-4"
          aria-hidden="true"
        >
          {displayValue || <span className="text-warm-400">Swipe here...</span>}
        </div>
      </div>
    )
  }

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={handleChange}
      disabled={disabled}
      placeholder="Swipe here..."
      autoComplete="off"
      autoCorrect="off"
      spellCheck={false}
      aria-label="Swipe the romaji for the displayed characters"
      className={[fieldClasses, 'text-warm-800'].join(' ')}
    />
  )
}
