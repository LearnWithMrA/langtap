// ─────────────────────────────────────────────
// File: components/dojo/help-card.tsx
// Purpose: Contextual banner tips for the Kana and Kotoba dojo
//          screens. Tips show one at a time, progressing on dismiss.
//          Persistence uses localStorage with useSyncExternalStore.
// Depends on: nothing
// ─────────────────────────────────────────────

'use client'

import { useCallback, useSyncExternalStore } from 'react'
import type { ReactNode } from 'react'

// ── Storage plumbing ──────────────────────────

const listeners = new Set<() => void>()

function emitLocalChange(): void {
  listeners.forEach((fn) => fn())
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange)
  window.addEventListener('storage', onChange)
  return (): void => {
    listeners.delete(onChange)
    window.removeEventListener('storage', onChange)
  }
}

function getTipIndex(key: string): number {
  if (typeof window === 'undefined') return 0
  const raw = window.localStorage.getItem(key)
  if (!raw) return 0
  const parsed = parseInt(raw, 10)
  return Number.isFinite(parsed) ? parsed : 0
}

function setTipIndex(key: string, index: number): void {
  window.localStorage.setItem(key, String(index))
  emitLocalChange()
}

// ── Tip data ──────────────────────────────────

const KANA_TIPS: { title: string; body: string }[] = [
  {
    title: 'Welcome to the Dojo',
    body: "Already know a character? Tap to unlock it, then tap again to mark it as mastered, so it won't appear as often.",
  },
  {
    title: 'Need a refresher?',
    body: "Forgotten one? Tap to reset it and it'll start showing up again.",
  },
]

const KOTOBA_TIPS: { title: string; body: string }[] = [
  {
    title: 'Welcome to Kotoba Dojo',
    body: 'Words unlock as you learn their characters. Keep practising kana and new words will appear here.',
  },
  {
    title: 'Explore your words',
    body: 'Tap a word to see its reading and meaning. Mastered words have a gold bar.',
  },
]

// ── Hooks ─────────────────────────────────────

const KANA_KEY = 'dojo.kana.tipIndex'
const KOTOBA_KEY = 'dojo.kotoba.tipIndex'

function useTipProgress(
  storageKey: string,
  tips: { title: string; body: string }[],
): {
  dismissed: boolean
  currentTip: { title: string; body: string } | null
  advance: () => void
} {
  const snapshot = useSyncExternalStore(
    subscribe,
    () => getTipIndex(storageKey),
    () => 0,
  )
  const dismissed = snapshot >= tips.length
  const currentTip = dismissed ? null : (tips[snapshot] ?? null)

  const advance = useCallback((): void => {
    setTipIndex(storageKey, snapshot + 1)
  }, [storageKey, snapshot])

  return { dismissed, currentTip, advance }
}

export function useHelpDismissed(): { dismissed: boolean; dismiss: () => void } {
  const { dismissed, advance } = useTipProgress(KANA_KEY, KANA_TIPS)
  return { dismissed, dismiss: advance }
}

export function useKanaTips(): {
  dismissed: boolean
  currentTip: { title: string; body: string } | null
  advance: () => void
} {
  return useTipProgress(KANA_KEY, KANA_TIPS)
}

export function useKotobaTips(): {
  dismissed: boolean
  currentTip: { title: string; body: string } | null
  advance: () => void
} {
  return useTipProgress(KOTOBA_KEY, KOTOBA_TIPS)
}

// ── Component ─────────────────────────────────

type HelpCardProps = {
  title: string
  body: string
  icon?: string
  iconBg?: string
  buttonClass?: string
  onDismiss: () => void
}

export function HelpCard({
  title,
  body,
  icon = 'あ',
  iconBg = 'bg-sage-100',
  buttonClass = 'bg-sage-500 hover:bg-sage-600 border-b-sage-600',
  onDismiss,
}: HelpCardProps): ReactNode {
  return (
    <aside
      aria-label="Dojo tip"
      className="relative bg-cream border border-warm-200 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm max-w-3xl mx-auto"
    >
      <div
        aria-hidden="true"
        className={`flex-shrink-0 w-10 h-10 rounded-full ${iconBg} flex items-center justify-center text-xl leading-none`}
      >
        {icon}
      </div>
      <div className="flex-1">
        <h2 className="text-base font-medium text-warm-800">{title}</h2>
        <p className="text-sm text-warm-500 mt-0.5">{body}</p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss tip"
        className={`inline-flex items-center justify-center min-h-9 px-4 py-1.5 rounded-lg text-white font-bold text-sm border-b-[3px] active:translate-y-[1px] active:border-b-[2px] focus:outline-none transition-colors ${buttonClass}`}
      >
        Got it
      </button>
    </aside>
  )
}
