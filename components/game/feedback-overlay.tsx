// ------------------------------------------------------------
// File: components/game/feedback-overlay.tsx
// Purpose: Romaji hint shown below the character prompt after
//          a wrong answer. Fades in with a CSS transition.
// Depends on: nothing
// ------------------------------------------------------------

import type { ReactNode } from 'react'

// -- Types --------------------------------------------------

type FeedbackOverlayProps = {
  romaji: string
  visible: boolean
}

// -- Component ----------------------------------------------

export function FeedbackOverlay({ romaji, visible }: FeedbackOverlayProps): ReactNode {
  return (
    <div
      className={[
        'text-sm text-warm-400 text-center transition-opacity duration-200',
        visible ? 'opacity-100' : 'opacity-0',
      ].join(' ')}
      aria-live="polite"
    >
      {romaji}
    </div>
  )
}
