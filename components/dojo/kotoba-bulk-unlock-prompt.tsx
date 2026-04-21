// ─────────────────────────────────────────────
// File: components/dojo/kotoba-bulk-unlock-prompt.tsx
// Purpose: Scoped confirmation dialog for bulk Kotoba unlock. Used by
//          the green lock buttons on the page heading, every unit
//          card, and every level-group row. Each caller supplies the
//          explicit scope (label + wordIds) and this component asks
//          for a single destructive confirmation.
//          Mirrors BulkUnlockPrompt (Kana) so the flow is identical
//          across the two dojos; only the copy and payload differ.
// Depends on: components/ui/modal.tsx
// ─────────────────────────────────────────────

'use client'

import type { ReactNode } from 'react'
import { Modal } from '@/components/ui/modal'

// ── Types ─────────────────────────────────────

export type KotobaBulkUnlockScope = {
  label: string
  wordIds: readonly string[]
}

type KotobaBulkUnlockPromptProps = {
  scope: KotobaBulkUnlockScope | null
  onConfirm: (wordIds: readonly string[]) => void
  onClose: () => void
}

// ── Component ─────────────────────────────────

export function KotobaBulkUnlockPrompt({
  scope,
  onConfirm,
  onClose,
}: KotobaBulkUnlockPromptProps): ReactNode {
  if (!scope || scope.wordIds.length === 0) return null

  const count = scope.wordIds.length
  const plural = count === 1 ? '' : 's'

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      onConfirm={(): void => onConfirm(scope.wordIds)}
      isDanger={true}
      steps={[
        {
          title: `Unlock ${count} word${plural} in ${scope.label}?`,
          body: `This will unlock every remaining locked word in ${scope.label}. This cannot be undone without resetting all progress.`,
          confirmLabel: `Unlock ${count}`,
          cancelLabel: 'Cancel',
        },
      ]}
    />
  )
}
