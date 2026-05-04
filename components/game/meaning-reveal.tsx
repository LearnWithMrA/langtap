// ------------------------------------------------------------
// File: components/game/meaning-reveal.tsx
// Purpose: English meaning shown below the input area after a
//          correct answer. Also shows dual mnemonic text in orange
//          during the learning phase (character drills), turning
//          green on correct answer.
// Depends on: nothing
// ------------------------------------------------------------

import type { ReactNode } from 'react'

// -- Types --------------------------------------------------

type MeaningRevealProps = {
  meaning: string
  visible: boolean
  mnemonic?: string | null
  isCorrect?: boolean
}

// -- Component ----------------------------------------------

export function MeaningReveal({ meaning, visible, mnemonic, isCorrect }: MeaningRevealProps): ReactNode {
  if (mnemonic) {
    return (
      <div
        className={[
          'text-sm text-center transition-colors duration-150 min-h-6 leading-snug',
          isCorrect ? 'text-feedback-correct' : 'text-feedback-wrong',
        ].join(' ')}
        aria-live="polite"
      >
        {mnemonic}
      </div>
    )
  }

  return (
    <div
      className={[
        'text-base text-warm-600 text-center transition-opacity duration-150 min-h-6',
        visible ? 'opacity-100' : 'opacity-0',
      ].join(' ')}
      aria-live="polite"
    >
      {visible ? meaning : ' '}
    </div>
  )
}
