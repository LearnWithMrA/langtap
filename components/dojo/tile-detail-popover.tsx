// ─────────────────────────────────────────────
// File: components/dojo/tile-detail-popover.tsx
// Purpose: Two-step reset-progress confirmation flow for an unlocked
//          tile. Tapping an unlocked tile opens this flow directly (the
//          previous info-only popover was removed per design).
//          Step 1: "Reset progress on [kana]?" with Yes / No buttons.
//          Step 2: "Are you sure? This can't be undone." with Yes / No
//          buttons. Confirming on step 2 clears the score for that
//          character; the character stays unlocked (remains in
//          manuallyUnlocked) so it continues to appear in the chart.
//          Rendered via the shared Modal primitive; focus trap,
//          scroll-lock, and Escape dismiss are provided by Modal.
// Depends on: components/ui/modal.tsx, types/kana.types.ts
// ─────────────────────────────────────────────

'use client'

import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Modal } from '@/components/ui/modal'
import type { KanaCharacter } from '@/types/kana.types'

// ── Types ─────────────────────────────────────

type TileDetailPopoverProps = {
  character: KanaCharacter | null
  score: number
  onReset: (characterId: string) => void
  onClose: () => void
}

// ── Component ─────────────────────────────────

export function TileDetailPopover({
  character,
  score,
  onReset,
  onClose,
}: TileDetailPopoverProps): ReactNode {
  const [step, setStep] = useState<0 | 1>(0)

  // Reset the step index whenever the flow is (re)opened or closed so a fresh
  // invocation always starts at step 1 ("Reset progress on X?").
  useEffect(() => {
    if (!character) setStep(0)
  }, [character])

  if (!character) return null

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
        onReset(character.id)
        handleClose()
      }}
      currentStep={step}
      isDanger={true}
      steps={[
        {
          title: `Reset progress on ${character.kana}?`,
          body: `Current mastery: ${score}. Resetting clears your progress for ${character.kana} (${character.romaji}) but keeps the character unlocked.`,
          confirmLabel: 'Yes',
          cancelLabel: 'No',
        },
        {
          title: 'Are you sure?',
          body: `This can't be undone. ${character.kana} will go back to a mastery of 0.`,
          confirmLabel: 'Yes',
          cancelLabel: 'No',
        },
      ]}
    />
  )
}
