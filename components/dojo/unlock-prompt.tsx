// ─────────────────────────────────────────────
// File: components/dojo/unlock-prompt.tsx
// Purpose: Single-step confirmation modal for unlocking an individual
//          locked character. One tap → confirm. Matches GAME_DESIGN.md
//          §4.5 (single confirmation is sufficient for individual unlock).
// Depends on: components/ui/modal.tsx, types/kana.types.ts
// ─────────────────────────────────────────────

'use client'

import type { ReactNode } from 'react'
import { Modal } from '@/components/ui/modal'
import type { KanaCharacter } from '@/types/kana.types'

// ── Types ─────────────────────────────────────

type UnlockPromptProps = {
  character: KanaCharacter | null
  onConfirm: (characterId: string) => void
  onClose: () => void
}

// ── Component ─────────────────────────────────

export function UnlockPrompt({ character, onConfirm, onClose }: UnlockPromptProps): ReactNode {
  if (!character) return null

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      onConfirm={(): void => onConfirm(character.id)}
      steps={[
        {
          title: `Unlock ${character.kana}?`,
          body: 'You can practise this character straight away. This cannot be undone without resetting all progress.',
          confirmLabel: 'Unlock',
        },
      ]}
    />
  )
}
