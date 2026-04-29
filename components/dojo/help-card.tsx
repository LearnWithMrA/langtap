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
      className="relative bg-cream border border-warm-200 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm max-w-3xl mx-auto"
    >
      <div
        aria-hidden="true"
        className="flex-shrink-0 w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center text-xl leading-none"
      >
        あ
      </div>
      <div className="flex-1">
        <h2 className="text-base font-medium text-warm-800">Welcome to the Dojo</h2>
        <p className="text-sm text-warm-500 mt-0.5">
          Unlock more characters here, mark them as mastered, or just practice to follow our course.
        </p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss welcome card"
        className="inline-flex items-center justify-center min-h-9 px-4 py-1.5 rounded-lg bg-sky-600/85 text-white font-bold text-sm hover:bg-sky-700/85 border-b-[3px] border-b-sky-700/85 active:translate-y-[1px] active:border-b-[2px] focus:outline-none transition-colors"
      >
        Got it
      </button>
    </aside>
  )
}
