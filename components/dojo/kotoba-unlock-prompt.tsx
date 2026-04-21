// ─────────────────────────────────────────────
// File: components/dojo/kotoba-unlock-prompt.tsx
// Purpose: Single-step confirmation modal for unlocking an individual
//          locked Kotoba word. Mirrors UnlockPrompt (Kana) so the two
//          dojos feel identical; only the copy and the payload type
//          differ. One tap → confirm.
// Depends on: components/ui/modal.tsx, types/kotoba.types.ts
// ─────────────────────────────────────────────

'use client'

import type { ReactNode } from 'react'
import { Modal } from '@/components/ui/modal'
import type { KotobaWord } from '@/types/kotoba.types'

// ── Types ─────────────────────────────────────

type KotobaUnlockPromptProps = {
  word: KotobaWord | null
  onConfirm: (wordId: string) => void
  onClose: () => void
}

// ── Component ─────────────────────────────────

export function KotobaUnlockPrompt({
  word,
  onConfirm,
  onClose,
}: KotobaUnlockPromptProps): ReactNode {
  if (!word) return null
  const display = word.kanji ? `${word.kanji} (${word.kana})` : word.kana

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      onConfirm={(): void => onConfirm(word.id)}
      steps={[
        {
          title: `Unlock ${display}?`,
          body: 'You can practise this word straight away. This cannot be undone without resetting all progress.',
          confirmLabel: 'Unlock',
        },
      ]}
    />
  )
}
