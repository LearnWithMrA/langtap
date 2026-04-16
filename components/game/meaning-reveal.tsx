// ------------------------------------------------------------
// File: components/game/meaning-reveal.tsx
// Purpose: English meaning shown below the input area after a
//          correct answer. Fades in over 150ms, stays visible
//          for MEANING_DISPLAY_MS before the prompt advances.
// Depends on: nothing
// ------------------------------------------------------------

import type { ReactNode } from 'react'

// -- Types --------------------------------------------------

type MeaningRevealProps = {
  meaning: string
  visible: boolean
}

// -- Component ----------------------------------------------

export function MeaningReveal({ meaning, visible }: MeaningRevealProps): ReactNode {
  return (
    <div
      className={[
        'text-base text-warm-600 text-center transition-opacity duration-150',
        visible ? 'opacity-100' : 'opacity-0',
      ].join(' ')}
      aria-live="polite"
    >
      {visible ? meaning : '\u00A0'}
    </div>
  )
}
