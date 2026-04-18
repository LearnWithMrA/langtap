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

export function InputField({
  value,
  onChange,
  feedbackState,
  disabled,
  showKatakana = false,
}: InputFieldProps): ReactNode {
  // Display value: convert hiragana to katakana if showKatakana is on
  // Strip zero-width spaces for display, then convert
  const displayValue = showKatakana ? toKatakana(value.replace(/\u200B/g, '')) : value
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
    let newVal = e.target.value

    // On backspace: strip trailing zero-width spaces so one
    // backspace deletes both the invisible space and the kana
    if (newVal.length < value.length) {
      newVal = newVal.replace(/\u200B+$/, '')
      if (newVal.length === value.replace(/\u200B+$/, '').length) {
        newVal = newVal.slice(0, -1)
      }
    }

    const lastChar = newVal.replace(/\u200B/g, '').slice(-1)

    // If last character is hiragana, append a zero-width space
    // so the IME treats each kana as separate (no kanji suggestion)
    if (lastChar) {
      const isHiragana = lastChar.charCodeAt(0) >= 0x3040 && lastChar.charCodeAt(0) <= 0x309f
      if (isHiragana && newVal.length > value.replace(/\u200B+$/, '').length) {
        newVal = newVal.replace(/\u200B+$/, '') + '\u200B'
      }
    }

    if (lastChar && newVal.replace(/\u200B/g, '').length > value.replace(/\u200B/g, '').length) {
      playSound(lastChar.toLowerCase())
    }
    onChange(newVal)
  }

  // When showKatakana is on: real input has transparent text, katakana overlay on top
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
          aria-label="Type the hiragana, displayed as katakana"
          className={[fieldClasses, 'text-transparent caret-warm-800'].join(' ')}
        />
        <div
          className="absolute inset-0 flex items-center justify-center text-xl text-warm-800 pointer-events-none px-4"
          aria-hidden="true"
        >
          {displayValue || <span className="text-warm-400">Type here...</span>}
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
      placeholder="Type here..."
      autoComplete="off"
      autoCorrect="off"
      spellCheck={false}
      aria-label="Type the romaji for the displayed characters"
      className={[fieldClasses, 'text-warm-800'].join(' ')}
    />
  )
}
