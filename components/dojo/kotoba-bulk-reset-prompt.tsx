// ─────────────────────────────────────────────
// File: components/dojo/kotoba-bulk-reset-prompt.tsx
// Purpose: Two-option prompt for fully-unlocked Kotoba scopes. When
//          every word in a scope is already unlocked, the grey button
//          opens this prompt with two actions:
//          - "Reset all progress": clears scores to 0, keeps unlocked.
//            Uses a two-step confirmation before executing.
//          - "Mark all as mastered": sets every word to mastered.
//          Mirrors the Kana BulkResetPrompt pattern with the added
//          mark-mastered option.
// Depends on: components/ui/modal.tsx
// ─────────────────────────────────────────────

'use client'

import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Modal } from '@/components/ui/modal'

// ── Types ─────────────────────────────────────

export type KotobaBulkResetScope = {
  label: string
  wordIds: readonly string[]
}

type KotobaBulkResetPromptProps = {
  scope: KotobaBulkResetScope | null
  onReset: (wordIds: readonly string[]) => void
  onMarkMastered: (wordIds: readonly string[]) => void
  onClose: () => void
}

// ── Component ─────────────────────────────────

export function KotobaBulkResetPrompt({
  scope,
  onReset,
  onMarkMastered,
  onClose,
}: KotobaBulkResetPromptProps): ReactNode {
  const [step, setStep] = useState<0 | 1>(0)

  useEffect(() => {
    if (!scope) setStep(0)
  }, [scope])

  if (!scope || scope.wordIds.length === 0) return null

  const count = scope.wordIds.length
  const plural = count === 1 ? '' : 's'

  const handleClose = (): void => {
    setStep(0)
    onClose()
  }

  if (step === 0) {
    return (
      <Modal
        isOpen={true}
        onClose={handleClose}
        onConfirm={(): void => setStep(1)}
        secondaryAction={{
          label: 'Mark all as mastered',
          onClick: (): void => {
            onMarkMastered(scope.wordIds)
            handleClose()
          },
        }}
        steps={[
          {
            title: `${scope.label}`,
            body: `All ${count} word${plural} in ${scope.label} are unlocked. What would you like to do?`,
            confirmLabel: 'Reset all progress',
            cancelLabel: 'Cancel',
          },
        ]}
      />
    )
  }

  return (
    <Modal
      isOpen={true}
      onClose={handleClose}
      onConfirm={(): void => {
        onReset(scope.wordIds)
        handleClose()
      }}
      isDanger={true}
      steps={[
        {
          title: 'Are you sure?',
          body: `This can't be undone. All ${count} word${plural} in ${scope.label} will go back to mastery of 0.`,
          confirmLabel: 'Yes, reset',
          cancelLabel: 'No',
        },
      ]}
    />
  )
}
