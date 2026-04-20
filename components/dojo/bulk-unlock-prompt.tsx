// ─────────────────────────────────────────────
// File: components/dojo/bulk-unlock-prompt.tsx
// Purpose: Scoped confirmation dialog for bulk unlock. Used by the
//          "Unlock N" buttons that sit next to each group progress bar.
//          The old three-option picker (stage / sub-section / select) was
//          dropped once the Dojo hierarchy flipped to script-first and
//          each progress bar got its own inline unlock button. Each
//          button supplies the explicit scope (label + characterIds) and
//          this component asks for a single destructive confirmation.
// Depends on: components/ui/modal.tsx
// ─────────────────────────────────────────────

'use client'

import type { ReactNode } from 'react'
import { Modal } from '@/components/ui/modal'

// ── Types ─────────────────────────────────────

export type BulkUnlockScope = {
  label: string
  characterIds: readonly string[]
}

type BulkUnlockPromptProps = {
  scope: BulkUnlockScope | null
  onConfirm: (characterIds: readonly string[]) => void
  onClose: () => void
}

// ── Component ─────────────────────────────────

export function BulkUnlockPrompt({ scope, onConfirm, onClose }: BulkUnlockPromptProps): ReactNode {
  if (!scope || scope.characterIds.length === 0) return null

  const count = scope.characterIds.length
  const plural = count === 1 ? '' : 's'

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      onConfirm={(): void => onConfirm(scope.characterIds)}
      isDanger={true}
      steps={[
        {
          title: `Unlock ${count} character${plural} in ${scope.label}?`,
          body: `This will unlock every remaining locked character in ${scope.label}. This cannot be undone without resetting all progress.`,
          confirmLabel: `Unlock ${count}`,
          cancelLabel: 'Cancel',
        },
      ]}
    />
  )
}
