// ─────────────────────────────────────────────
// File: hooks/useDialogueSeen.ts
// Purpose: Tracks which tutorial dialogues a player has seen.
//          Uses localStorage with useSyncExternalStore for
//          SSR-safe hydration. Same pattern as dojo help-card.
// Depends on: data/tutorial/dialogue-scripts.ts
// ─────────────────────────────────────────────

import { useCallback, useSyncExternalStore } from 'react'
import type { DialogueTrigger } from '@/data/tutorial/dialogue-scripts'

// ── Storage plumbing ──────────────────────────

const STORAGE_KEY = 'langtap-dialogues-seen'
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

function getSeenSet(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return new Set()
  try {
    const parsed: unknown = JSON.parse(raw)
    if (Array.isArray(parsed)) return new Set(parsed as string[])
  } catch {
    // Corrupted data, start fresh
  }
  return new Set()
}

function getSnapshot(): string {
  return window.localStorage.getItem(STORAGE_KEY) ?? '[]'
}

function getServerSnapshot(): string {
  return '[]'
}

// ── Standalone clear (for factory reset) ─────

export function clearAllDialoguesSeen(): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(STORAGE_KEY)
  emitLocalChange()
}

// ── Hook ──────────────────────────────────────

export function useDialogueSeen(trigger: DialogueTrigger): {
  hasSeen: boolean
  markSeen: () => void
} {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const seen = getSeenSet()
  const hasSeen = seen.has(trigger)

  const markSeen = useCallback((): void => {
    const current = getSeenSet()
    current.add(trigger)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...current]))
    emitLocalChange()
  }, [trigger])

  // raw is used to trigger re-renders when storage changes
  void raw

  return { hasSeen, markSeen }
}
