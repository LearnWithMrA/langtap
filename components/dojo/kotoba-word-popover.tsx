// ─────────────────────────────────────────────
// File: components/dojo/kotoba-word-popover.tsx
// Purpose: Detail flow triggered from a Kotoba word tile. Built on
//          the shared Modal primitive so focus trap, scroll lock,
//          Escape dismiss, and backdrop click all come for free.
//          Detail screen (step 0):
//          - Hero title: the kanji (or the kana when no kanji exists)
//            rendered large and centred via the Modal's ReactNode
//            title slot.
//          - Body: kana reading (only when a kanji exists, so the
//            reading is never duplicated), full english gloss, and
//            mastery.
//          - Footer: Close, Mark mastered, Reset progress. Equal-width
//            via Modal's flex-1 footer.
//          Mark mastered: single action. Sets the word's score to
//          MASTERY_THRESHOLD + 5 so the tile immediately renders the
//          gold ring and mastered text colour.
//          Reset confirmation: two-step destructive flow. Step 1 asks
//          for confirmation, step 2 asks again with "can't be undone"
//          copy, step 2 confirm clears the score back to 0.
// Depends on: components/ui/modal.tsx, types/kotoba.types.ts
// ─────────────────────────────────────────────

'use client'

import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Modal } from '@/components/ui/modal'
import type { KotobaWord } from '@/types/kotoba.types'

// ── Types ─────────────────────────────────────

type KotobaWordPopoverProps = {
  word: KotobaWord | null
  score: number
  onReset: (wordId: string) => void
  onMarkMastered: (wordId: string) => void
  onClose: () => void
}

// ── Helpers ───────────────────────────────────

function heroTitle(word: KotobaWord): ReactNode {
  return (
    <span className="block text-center text-4xl font-medium text-warm-800 leading-tight">
      {word.kanji ?? word.kana}
    </span>
  )
}

function detailBody(word: KotobaWord, score: number): ReactNode {
  return (
    <div className="flex flex-col items-center text-center gap-3">
      {word.kanji && <span className="text-xl text-warm-700 leading-tight">{word.kana}</span>}
      <p className="text-lg text-warm-800 max-w-[32ch] leading-snug">{word.english}</p>
      <p className="text-sm text-warm-500 mt-1">Mastery: {score}</p>
    </div>
  )
}

// ── Component ─────────────────────────────────

export function KotobaWordPopover({
  word,
  score,
  onReset,
  onMarkMastered,
  onClose,
}: KotobaWordPopoverProps): ReactNode {
  // step: 0 = detail view, 1 = reset confirm, 2 = final confirm
  const [step, setStep] = useState<0 | 1 | 2>(0)

  useEffect(() => {
    if (!word) setStep(0)
  }, [word])

  if (!word) return null

  const handleClose = (): void => {
    setStep(0)
    onClose()
  }

  // Detail view. Close is the cancel action. Reset progress is the
  // confirm action (advances into the two-step reset sequence). Mark
  // mastered is the secondary action and short-circuits to a direct
  // score update with no additional confirmation, because it's an
  // additive change the user can undo with the reset flow.
  if (step === 0) {
    return (
      <Modal
        isOpen={true}
        onClose={handleClose}
        onConfirm={(): void => setStep(1)}
        currentStep={0}
        isDanger={false}
        secondaryAction={{
          label: 'Mark mastered',
          onClick: (): void => {
            onMarkMastered(word.id)
            handleClose()
          },
        }}
        steps={[
          {
            title: heroTitle(word),
            body: detailBody(word, score),
            confirmLabel: 'Reset progress',
            cancelLabel: 'Close',
          },
        ]}
      />
    )
  }

  // Reset confirmation reuses the Modal's native two-step contract.
  // Step index inside Modal is 0 / 1, offset from our outer step.
  const modalStep = step === 1 ? 0 : 1
  return (
    <Modal
      isOpen={true}
      onClose={handleClose}
      onNextStep={(): void => setStep(2)}
      onConfirm={(): void => {
        onReset(word.id)
        handleClose()
      }}
      currentStep={modalStep}
      isDanger={true}
      steps={[
        {
          title: `Reset progress on ${word.kana}?`,
          body: `Current mastery: ${score}. Resetting clears progress for this word.`,
          confirmLabel: 'Yes',
          cancelLabel: 'No',
        },
        {
          title: 'Are you sure?',
          body: `This can't be undone. ${word.kana} will go back to a mastery of 0.`,
          confirmLabel: 'Yes',
          cancelLabel: 'No',
        },
      ]}
    />
  )
}
