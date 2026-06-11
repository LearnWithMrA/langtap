// ─────────────────────────────────────────────
// File: components/profile/reset-progress.tsx
// Purpose: Reset progress section for the profile screen. Three options:
//          Reset Kana, Reset Kotoba, and Full Reset. All use a typed
//          "RESET" confirmation dialog. Pure UI: all business logic
//          lives in hooks/useResetActions.ts.
// Depends on: hooks/useResetActions.ts
// ─────────────────────────────────────────────

'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { useResetActions } from '@/hooks/useResetActions'

// ── Types ─────────────────────────────────────

type ResetTarget = 'kana' | 'kotoba' | 'all' | null

// ── Constants ─────────────────────────────────

const CONFIRM_PHRASE = 'RESET'

const RESET_CONFIG: Record<
  Exclude<ResetTarget, null>,
  { title: string; body: string; button: string }
> = {
  kana: {
    title: 'Reset kana progress?',
    body: 'This will permanently reset all kana mastery scores, learning progress, and manual unlocks to zero. Characters unlocked during onboarding will be preserved. This cannot be undone.',
    button: 'Reset kana',
  },
  kotoba: {
    title: 'Reset word progress?',
    body: 'This will permanently reset all word mastery scores and remove all manual word unlocks. This cannot be undone.',
    button: 'Reset kotoba',
  },
  all: {
    title: 'Reset all progress?',
    body: 'This will permanently delete all your progress: mastery scores, unlocks, word progress, leaderboard scores, practice history, and tutorial state. Your settings and daily cap will be preserved. This cannot be undone.',
    button: 'Reset everything',
  },
}

// ── Main export ───────────────────────────────

export function ResetProgress(): ReactNode {
  const { resetKana, resetKotoba, resetAll } = useResetActions()

  const [activeTarget, setActiveTarget] = useState<ResetTarget>(null)
  const [inputValue, setInputValue] = useState('')
  const [isResetting, setIsResetting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  const canConfirm = inputValue === CONFIRM_PHRASE

  // ── Dialog: Escape key + scroll lock + focus trap + focus restore ──

  useEffect(() => {
    if (!activeTarget) return

    previousFocusRef.current = document.activeElement as HTMLElement | null
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' && !isResetting) {
        setActiveTarget(null)
        setInputValue('')
        setError(null)
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
  }, [activeTarget, isResetting])

  // ── Reset handler ──────────────────────────

  const handleConfirm = useCallback(async (): Promise<void> => {
    if (!activeTarget || !canConfirm || isResetting) return

    setIsResetting(true)
    setError(null)

    let result: { ok: boolean; error?: string }
    if (activeTarget === 'kana') {
      result = await resetKana()
    } else if (activeTarget === 'kotoba') {
      result = await resetKotoba()
    } else {
      result = await resetAll()
    }

    if (result.ok) {
      setActiveTarget(null)
      setInputValue('')
    } else {
      setError(result.error ?? 'Reset failed.')
    }

    setIsResetting(false)
  }, [activeTarget, canConfirm, isResetting, resetKana, resetKotoba, resetAll])

  const closeDialog = useCallback((): void => {
    if (isResetting) return
    setActiveTarget(null)
    setInputValue('')
    setError(null)
  }, [isResetting])

  const config = activeTarget ? RESET_CONFIG[activeTarget] : null

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
            onClick={(): void => setActiveTarget('kana')}
            className="flex-1 bg-red-600/80 text-white rounded-xl px-4 py-2 text-xs font-medium shadow-[0_3px_0_0_#b04050] active:translate-y-[2px] active:shadow-none transition-all duration-75 min-h-[36px]"
          >
            Reset Kana
          </button>
          <button
            type="button"
            onClick={(): void => setActiveTarget('kotoba')}
            className="flex-1 bg-red-600/80 text-white rounded-xl px-4 py-2 text-xs font-medium shadow-[0_3px_0_0_#b04050] active:translate-y-[2px] active:shadow-none transition-all duration-75 min-h-[36px]"
          >
            Reset Kotoba
          </button>
        </div>
        <div className="mt-3">
          <button
            type="button"
            onClick={(): void => setActiveTarget('all')}
            className="w-full bg-red-800/90 text-white rounded-xl px-4 py-2 text-xs font-medium shadow-[0_3px_0_0_#6b1a1a] active:translate-y-[2px] active:shadow-none transition-all duration-75 min-h-[36px]"
          >
            Full Reset
          </button>
        </div>
      </div>

      {activeTarget !== null && config !== null && (
        <div
          role="presentation"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={closeDialog}
        >
          <div aria-hidden="true" className="absolute inset-0 bg-warm-800/40" />
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={config.title}
            onClick={(e): void => e.stopPropagation()}
            className="relative bg-surface-raised border border-border rounded-2xl p-6 w-full max-w-sm shadow-lg"
          >
            <h2 className="text-xl font-medium text-text-primary mb-3">{config.title}</h2>
            <div className="text-sm text-text-secondary mb-4 flex flex-col gap-3">
              <p>{config.body}</p>
              <p>
                Type <span className="font-mono font-bold text-text-primary">{CONFIRM_PHRASE}</span>{' '}
                to confirm.
              </p>
              <input
                type="text"
                value={inputValue}
                onChange={(e): void => setInputValue(e.target.value)}
                placeholder={CONFIRM_PHRASE}
                aria-label="Type RESET to confirm"
                className="w-full border border-border rounded-lg px-3 py-2 text-base sm:text-sm text-warm-800 bg-surface-raised focus:outline-none focus:ring-2 focus:ring-red-300"
                autoComplete="off"
                spellCheck={false}
              />
              {error !== null && <p className="text-xs text-red-600">{error}</p>}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={closeDialog}
                disabled={isResetting}
                className="flex-1 rounded-xl px-4 py-2 text-sm font-medium text-text-secondary hover:bg-warm-100 transition-colors duration-150 min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={!canConfirm || isResetting}
                className="flex-1 rounded-xl px-4 py-2 text-sm font-medium text-white bg-red-800 hover:bg-red-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 min-h-[44px]"
              >
                {isResetting ? 'Resetting...' : config.button}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
