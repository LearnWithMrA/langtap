// ------------------------------------------------------------
// File: components/game/character-display.tsx
// Purpose: Displays the kana character being practised.
//          Largest element on the practice screen. Font size is
//          fixed at text-5xl/text-6xl (mastery-linked sizing
//          wired in a later sprint).
// Depends on: nothing
// ------------------------------------------------------------

import type { ReactNode } from 'react'

// -- Types --------------------------------------------------

type CharacterDisplayProps = {
  character: string
}

// -- Component ----------------------------------------------

export function CharacterDisplay({ character }: CharacterDisplayProps): ReactNode {
  return (
    <div className="text-5xl md:text-6xl font-bold text-warm-800 text-center py-1 select-none leading-tight">
      {character}
    </div>
  )
}
