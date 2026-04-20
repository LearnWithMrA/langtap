// ─────────────────────────────────────────────
// File: components/dojo/bulk-reset-prompt.tsx
// Purpose: Two-step confirmation flow for resetting progress on every
//          character in a group (a stage, a script, or the whole
//          dojo). Triggered when the user taps the grey "unlocked"
//          icon that replaces the blue unlock button once every
//          character in that scope is already unlocked.
//          Step 1: "Reset progress on all characters in [label]?" Yes/No
//          Step 2: "Are you sure? This can't be undone." Yes/No
//          Confirming clears each character's mastery score back to 0
//          while keeping them in the manually-unlocked set so they
//          remain visible as unlocked-at-0 tiles.
// Depends on: components/ui/modal.tsx
// ─────────────────────────────────────────────

'use client'

import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Modal } from '@/components/ui/modal'

// ── Types ─────────────────────────────────────

export type BulkResetScope = {
  label: string
  characterIds: readonly string[]
}

type BulkResetPromptProps = {
  scope: BulkResetScope | null
  onConfirm: (characterIds: readonly string[]) => void
  onClose: () => void
}

// ── Component ─────────────────────────────────

export function BulkResetPrompt({ scope, onConfirm, onClose }: BulkResetPromptProps): ReactNode {
  const [step, setStep] = useState<0 | 1>(0)

  useEffect(() => {
    if (!scope) setStep(0)
  }, [scope])

  if (!scope || scope.characterIds.length === 0) return null

  const count = scope.characterIds.length
  const plural = count === 1 ? '' : 's'

  const handleClose = (): void => {
    setStep(0)
    onClose()
  }

  return (
    <Modal
      isOpen={true}
      onClose={handleClose}
      onNextStep={(): void => setStep(1)}
      onConfirm={(): void => {
        onConfirm(scope.characterIds)
        handleClose()
      }}
      currentStep={step}
      isDanger={true}
      steps={[
        {
          title: `Reset progress on all characters in ${scope.label}?`,
          body: `Mastery scores for ${count} character${plural} in ${scope.label} will be cleared. Every character stays unlocked so you can keep practising.`,
          confirmLabel: 'Yes',
          cancelLabel: 'No',
        },
        {
          title: 'Are you sure?',
          body: `This can't be undone. All ${count} character${plural} in ${scope.label} will go back to mastery of 0.`,
          confirmLabel: 'Yes',
          cancelLabel: 'No',
        },
      ]}
    />
  )
}
