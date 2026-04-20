// ─────────────────────────────────────────────
// File: components/dojo/help-card.tsx
// Purpose: Empty-state onboarding card shown above the Seion section
//          when no characters are unlocked. Dismissible; dismissal is
//          persisted to localStorage so the card does not return after
//          a reload.
//          Persistence read uses useSyncExternalStore for SSR-safe
//          hydration. Writes emit a synchronous local notification so
//          same-tab updates propagate without needing a round-trip
//          through the cross-tab `storage` event.
// Depends on: components/ui/button.tsx
// ─────────────────────────────────────────────

'use client'

import Link from 'next/link'
import { useCallback, useSyncExternalStore } from 'react'
import type { ReactNode } from 'react'

// ── Storage plumbing ──────────────────────────

const STORAGE_KEY = 'dojo.kana.helpDismissed'
const listeners = new Set<() => void>()

function emitLocalChange(): void {
  listeners.forEach((fn) => fn())
}

function subscribeToStorage(onChange: () => void): () => void {
  listeners.add(onChange)
  window.addEventListener('storage', onChange)
  return (): void => {
    listeners.delete(onChange)
    window.removeEventListener('storage', onChange)
  }
}

function getStoredDismissed(): boolean {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(STORAGE_KEY) === 'true'
}

function serverDismissed(): boolean {
  return false
}

function setStoredDismissed(): void {
  window.localStorage.setItem(STORAGE_KEY, 'true')
  emitLocalChange()
}

export function useHelpDismissed(): { dismissed: boolean; dismiss: () => void } {
  const dismissed = useSyncExternalStore(subscribeToStorage, getStoredDismissed, serverDismissed)
  const dismiss = useCallback((): void => {
    setStoredDismissed()
  }, [])
  return { dismissed, dismiss }
}

// ── Component ─────────────────────────────────

type HelpCardProps = {
  onDismiss: () => void
}

export function HelpCard({ onDismiss }: HelpCardProps): ReactNode {
  return (
    <aside
      aria-label="Getting started"
      className="relative bg-cream border border-warm-200 rounded-2xl p-5 flex flex-col md:flex-row md:items-center gap-4 shadow-sm"
    >
      <div
        aria-hidden="true"
        className="flex-shrink-0 w-12 h-12 rounded-full bg-sage-100 flex items-center justify-center text-2xl"
      >
        あ
      </div>
      <div className="flex-1">
        <h2 className="text-lg font-medium text-warm-800">Start your journey</h2>
        <p className="text-sm text-warm-600 mt-1">
          Tap any character to unlock it, or jump into practice and unlock as you go.
        </p>
      </div>
      <div className="flex gap-2">
        <Link
          href="/practice?mode=kana"
          className="inline-flex items-center justify-center min-h-11 min-w-11 px-4 py-2 rounded-xl bg-sage-500 text-white font-medium text-sm hover:bg-sage-600 focus:outline-none focus:ring-2 focus:ring-sage-300 focus:ring-offset-1 transition-colors"
        >
          Start practice
        </Link>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss getting-started card"
          className="inline-flex items-center justify-center min-h-11 min-w-11 px-3 py-2 rounded-xl text-warm-600 hover:bg-warm-100 focus:outline-none focus:ring-2 focus:ring-sage-300 transition-colors text-sm"
        >
          Dismiss
        </button>
      </div>
    </aside>
  )
}
