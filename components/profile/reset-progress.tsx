// ─────────────────────────────────────────────
// File: components/profile/reset-progress.tsx
// Purpose: Reset progress section for the profile screen. Three options:
//          Reset Kana, Reset Kotoba (two-step modal), and Full Reset
//          (typed "RESET" confirmation). Pure UI: all business logic
//          lives in hooks/useResetActions.ts.
// Depends on: hooks/useResetActions.ts, components/ui/modal.tsx
// ─────────────────────────────────────────────

'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { Modal } from '@/components/ui/modal'
import { useResetActions } from '@/hooks/useResetActions'

// ── Types ─────────────────────────────────────

type ResetTarget = 'kana' | 'kotoba' | null

// ── Constants ─────────────────────────────────

const FACTORY_CONFIRM_PHRASE = 'RESET'

// ── Main export ───────────────────────────────

export function ResetProgress(): ReactNode {
  const { resetKana, resetKotoba, resetAll } = useResetActions()

  // Per-domain reset state
  const [confirmTarget, setConfirmTarget] = useState<ResetTarget>(null)
  const [isResetting, setIsResetting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Factory reset state
  const [showFactoryDialog, setShowFactoryDialog] = useState(false)
  const [factoryInput, setFactoryInput] = useState('')
  const [isFactoryResetting, setIsFactoryResetting] = useState(false)
  const [factoryError, setFactoryError] = useState<string | null>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  const canConfirmFactory = factoryInput === FACTORY_CONFIRM_PHRASE

  // ── Factory dialog: Escape key + scroll lock + focus restore ──

  useEffect(() => {
    if (!showFactoryDialog) return

    previousFocusRef.current = document.activeElement as HTMLElement | null
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' && !isFactoryResetting) {
        setShowFactoryDialog(false)
        setFactoryInput('')
        setFactoryError(null)
      }

      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'input, button:not([disabled])',
        )
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return (): void => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
      previousFocusRef.current?.focus()
    }
  }, [showFactoryDialog, isFactoryResetting])

  // ── Per-domain reset handler ────────────────

  const handleReset = useCallback(async (): Promise<void> => {
    if (!confirmTarget || isResetting) return

    setIsResetting(true)
    setError(null)

    const result = confirmTarget === 'kana' ? await resetKana() : await resetKotoba()

    if (result.ok) {
      setConfirmTarget(null)
    } else {
      setError(result.error)
    }

    setIsResetting(false)
  }, [confirmTarget, isResetting, resetKana, resetKotoba])

  // ── Factory reset handler ───────────────────

  const handleFactoryReset = useCallback(async (): Promise<void> => {
    if (!canConfirmFactory || isFactoryResetting) return

    setIsFactoryResetting(true)
    setFactoryError(null)

    const result = await resetAll()

    if (result.ok) {
      setShowFactoryDialog(false)
      setFactoryInput('')
    } else {
      setFactoryError(result.error)
    }

    setIsFactoryResetting(false)
  }, [canConfirmFactory, isFactoryResetting, resetAll])

  // ── Modal close handlers ────────────────────

  const closeModal = useCallback((): void => {
    if (isResetting) return
    setConfirmTarget(null)
    setError(null)
  }, [isResetting])

  const closeFactoryDialog = useCallback((): void => {
    if (isFactoryResetting) return
    setShowFactoryDialog(false)
    setFactoryInput('')
    setFactoryError(null)
  }, [isFactoryResetting])

  const modalTitle = confirmTarget === 'kana' ? 'Reset kana progress?' : 'Reset word progress?'
  const modalBody =
    confirmTarget === 'kana'
      ? 'This will reset all kana mastery scores and learning progress to zero, and remove all manual unlocks. This cannot be undone.'
      : 'This will reset all word mastery scores to zero and remove all manual word unlocks. This cannot be undone.'

  return (
    <>
      <div
        role="region"
        aria-label="Reset progress"
        className="bg-surface-raised rounded-2xl border border-border px-4 py-4"
      >
        <p className="text-xs font-medium text-warm-400 uppercase tracking-wider mb-3">
          Reset progress
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={(): void => setConfirmTarget('kana')}
            className="flex-1 bg-red-600/80 text-white rounded-xl px-4 py-2 text-xs font-medium shadow-[0_3px_0_0_#b04050] active:translate-y-[2px] active:shadow-none transition-all duration-75 min-h-[36px]"
          >
            Reset Kana
          </button>
          <button
            type="button"
            onClick={(): void => setConfirmTarget('kotoba')}
            className="flex-1 bg-red-600/80 text-white rounded-xl px-4 py-2 text-xs font-medium shadow-[0_3px_0_0_#b04050] active:translate-y-[2px] active:shadow-none transition-all duration-75 min-h-[36px]"
          >
            Reset Kotoba
          </button>
        </div>
        <div className="mt-3">
          <button
            type="button"
            onClick={(): void => setShowFactoryDialog(true)}
            className="w-full bg-red-800/90 text-white rounded-xl px-4 py-2 text-xs font-medium shadow-[0_3px_0_0_#6b1a1a] active:translate-y-[2px] active:shadow-none transition-all duration-75 min-h-[36px]"
          >
            Full Reset
          </button>
        </div>
      </div>

      {/* Per-domain reset modal (Kana / Kotoba) */}
      <Modal
        isOpen={confirmTarget !== null}
        onClose={closeModal}
        onConfirm={handleReset}
        isDanger
        steps={[
          {
            title: modalTitle,
            body: (
              <div className="flex flex-col gap-2">
                <p className="text-sm text-warm-600">{modalBody}</p>
                {error !== null && <p className="text-sm text-red-600">{error}</p>}
                {isResetting && <p className="text-sm text-warm-400">Resetting...</p>}
              </div>
            ),
            confirmLabel: isResetting ? 'Resetting...' : 'Reset',
            cancelLabel: 'Cancel',
          },
        ]}
      />

      {/* Factory reset dialog with typed confirmation */}
      {showFactoryDialog && (
        <div
          role="presentation"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={closeFactoryDialog}
        >
          <div aria-hidden="true" className="absolute inset-0 bg-warm-800/40" />
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Full reset confirmation"
            onClick={(e): void => e.stopPropagation()}
            className="relative bg-surface-raised border border-border rounded-2xl p-6 w-full max-w-sm shadow-lg"
          >
            <h2 className="text-xl font-medium text-text-primary mb-3">Reset all progress?</h2>
            <div className="text-sm text-text-secondary mb-4 flex flex-col gap-3">
              <p>
                This will permanently delete all your progress: mastery scores, unlocks, word
                progress, leaderboard scores, practice history, and tutorial state. Your settings
                and daily cap will be preserved.
              </p>
              <p>This cannot be undone.</p>
              <p>
                Type{' '}
                <span className="font-mono font-bold text-text-primary">
                  {FACTORY_CONFIRM_PHRASE}
                </span>{' '}
                to confirm.
              </p>
              <input
                type="text"
                value={factoryInput}
                onChange={(e): void => setFactoryInput(e.target.value)}
                placeholder={FACTORY_CONFIRM_PHRASE}
                aria-label="Type RESET to confirm"
                className="w-full border border-border rounded-lg px-3 py-2 text-sm text-warm-800 bg-surface-raised focus:outline-none focus:ring-2 focus:ring-red-300"
                autoComplete="off"
                spellCheck={false}
                autoFocus
              />
              {factoryError !== null && <p className="text-xs text-red-600">{factoryError}</p>}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={closeFactoryDialog}
                disabled={isFactoryResetting}
                className="flex-1 rounded-xl px-4 py-2 text-sm font-medium text-text-secondary hover:bg-warm-100 transition-colors duration-150 min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleFactoryReset}
                disabled={!canConfirmFactory || isFactoryResetting}
                className="flex-1 rounded-xl px-4 py-2 text-sm font-medium text-white bg-red-800 hover:bg-red-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 min-h-[44px]"
              >
                {isFactoryResetting ? 'Resetting...' : 'Reset everything'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
