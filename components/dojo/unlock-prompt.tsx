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
  score?: number
  onConfirm: (characterId: string) => void
  onClose: () => void
}

// ── Component ─────────────────────────────────

export function UnlockPrompt({
  character,
  score = 0,
  onConfirm,
  onClose,
}: UnlockPromptProps): ReactNode {
  if (!character) return null

  const progress = Math.min(score, 5)

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      onConfirm={(): void => onConfirm(character.id)}
      confirmVariant="sky"
      steps={[
        {
          title: `Unlock ${character.kana}?`,
          body: (
            <>
              <p className="font-medium mb-2">Learning progress: {progress}/5</p>
              <p>
                Unlocking will skip the learning phase and it will appear in full words. This cannot
                be undone without resetting all progress.
              </p>
            </>
          ),
          confirmLabel: 'Unlock',
        },
      ]}
    />
  )
}
