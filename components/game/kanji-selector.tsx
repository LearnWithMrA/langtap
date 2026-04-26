// ─────────────────────────────────────────────
// File: components/game/kanji-selector.tsx
// Purpose: Stage 2 kanji selection grid for Kotoba Tap mode.
//          2x2 grid with 4 kanji option buttons (1 correct, 3
//          distractors). Keyboard-key 3D style matching TapInput.
// Depends on: hooks/useKeySound.ts
// ─────────────────────────────────────────────

'use client'

import type { ReactNode } from 'react'
import { useKeySound } from '@/hooks/useKeySound'

// ── Types ─────────────────────────────────────

type KanjiSelectorProps = {
  options: readonly string[]
  correctAnswer: string
  onSelect: (kanji: string) => void
  feedbackId: string | null
  feedbackState: 'correct' | 'wrong' | 'idle'
}

// ── Main export ──────────────────────────────

export function KanjiSelector({
  options,
  correctAnswer,
  onSelect,
  feedbackId,
  feedbackState,
}: KanjiSelectorProps): ReactNode {
  const { playSound } = useKeySound()

  return (
    <div className="mt-4">
      <p className="text-xs font-medium text-warm-400 uppercase tracking-wider mb-3 text-center">
        Kanji
      </p>
      <div
        className="grid grid-cols-2 gap-3 max-w-[200px] mx-auto"
        role="group"
        aria-label="Select the correct kanji"
      >
        {options.map((kanji) => {
          const isFeedbackTarget = feedbackId === kanji
          const bgClass = isFeedbackTarget && feedbackState === 'correct'
            ? 'bg-sage-400'
            : isFeedbackTarget && feedbackState === 'wrong'
              ? 'bg-feedback-wrong'
              : 'bg-sage-100'

          return (
            <button
              key={kanji}
              type="button"
              onClick={(): void => {
                playSound(kanji === correctAnswer ? 'e' : 'o')
                onSelect(kanji)
              }}
              className={`${bgClass} rounded-xl shadow-[0_3px_0_0_var(--color-sage-300)] active:translate-y-[3px] active:shadow-none transition-all duration-75 min-w-[72px] min-h-[72px] flex items-center justify-center cursor-pointer`}
              aria-label={`Select ${kanji}`}
            >
              <span className="text-3xl font-bold text-warm-800">{kanji}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
