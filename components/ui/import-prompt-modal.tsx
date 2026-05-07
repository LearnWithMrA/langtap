// ─────────────────────────────────────────────
// File: components/ui/import-prompt-modal.tsx
// Purpose: Non-dismissable modal for guest or legacy import
//          prompts. Shows Import and Skip buttons. Cannot be
//          closed by backdrop click, Escape, or X button.
//          Practice is gated behind this decision.
// Depends on: components/ui/button.tsx
// ─────────────────────────────────────────────

'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'

// ── Types ─────────────────────────────────────

type ImportPromptModalProps = {
  isOpen: boolean
  variant: 'guest' | 'legacy'
  onImport: () => Promise<void>
  onSkip: () => Promise<void>
}

// ── Constants ─────────────────────────────────

const COPY = {
  guest: {
    title: 'Import local progress?',
    body: 'This browser has local practice progress from a guest session. Would you like to import it into your account?',
    warning:
      'This will merge local progress into your account. Previously reset progress may be restored.',
  },
  legacy: {
    title: 'Import local progress?',
    body: 'This browser has local practice progress from before your account was created. Would you like to import it into your account?',
    warning:
      'This will merge local progress into your account. Previously reset progress may be restored.',
  },
} as const

// ── Main export ───────────────────────────────

export function ImportPromptModal({
  isOpen,
  variant,
  onImport,
  onSkip,
}: ImportPromptModalProps): ReactNode {
  const [isImporting, setIsImporting] = useState(false)
  const [isSkipping, setIsSkipping] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const copy = COPY[variant]
  const isBusy = isImporting || isSkipping

  async function handleImport(): Promise<void> {
    setError(null)
    setIsImporting(true)
    try {
      await onImport()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsImporting(false)
    }
  }

  async function handleSkip(): Promise<void> {
    setError(null)
    setIsSkipping(true)
    try {
      await onSkip()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsSkipping(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-prompt-title"
    >
      <div className="mx-4 w-full max-w-md rounded-2xl bg-[#faf5e4] p-6 shadow-xl">
        <h2 id="import-prompt-title" className="mb-3 text-lg font-semibold text-[#2d2a26]">
          {copy.title}
        </h2>
        <p className="mb-3 text-sm text-[#6b6560]">{copy.body}</p>
        <p className="mb-5 rounded-lg bg-[#f5efe3] px-3 py-2 text-xs text-[#6b6560]">
          {copy.warning}
        </p>
        {error !== null && <p className="mb-3 text-sm text-[#c4544a]">{error}</p>}
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={handleSkip}
            disabled={isBusy}
            loading={isSkipping}
            aria-label="Skip import and start fresh"
          >
            Skip
          </Button>
          <Button
            variant="primary"
            onClick={handleImport}
            disabled={isBusy}
            loading={isImporting}
            aria-label="Import local progress"
          >
            Import
          </Button>
        </div>
      </div>
    </div>
  )
}
