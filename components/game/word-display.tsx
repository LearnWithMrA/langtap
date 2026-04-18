// ------------------------------------------------------------
// File: components/game/word-display.tsx
// Purpose: Displays the full word context above the character
//          prompt. Hidden when the word is a single character.
// Depends on: nothing
// ------------------------------------------------------------

import type { ReactNode } from 'react'

// -- Types --------------------------------------------------

type WordDisplayProps = {
  word: string
  visible: boolean
}

// -- Component ----------------------------------------------

export function WordDisplay({ word, visible }: WordDisplayProps): ReactNode {
  if (!visible || word.length <= 1) return null

  return <div className="text-sm text-warm-400 text-center">{word}</div>
}
