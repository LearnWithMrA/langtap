// ─────────────────────────────────────────────
// File: hooks/useUsernameRepair.ts
// Purpose: Detects whether the current user has a default OAuth
//          username (user_[uuid-prefix]) and manages the soft
//          prompt lifecycle: dismissable initially, blocking after
//          3 dismissals. Uses localStorage for dismissal count.
// Depends on: stores/user.store.ts, hooks/useAuth.ts
// ─────────────────────────────────────────────

import { useCallback, useMemo, useState, useSyncExternalStore } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useUserStore } from '@/stores/user.store'

// ── Constants ─────────────────────────────────

const DISMISS_THRESHOLD = 3
const STORAGE_KEY_PREFIX = 'langtap-username-repair-dismissed'

// ── Helpers ───────────────────────────────────

function isDefaultUsername(username: string, userId: string): boolean {
  const expected = `user_${userId.slice(0, 8)}`
  return username === expected
}

function storageKey(userId: string): string {
  return `${STORAGE_KEY_PREFIX}:${userId}`
}

function getDismissCount(userId: string): number {
  if (typeof window === 'undefined') return 0
  const raw = localStorage.getItem(storageKey(userId))
  if (!raw) return 0
  const n = parseInt(raw, 10)
  return Number.isFinite(n) ? n : 0
}

function incrementDismissCount(userId: string): void {
  const current = getDismissCount(userId)
  localStorage.setItem(storageKey(userId), String(current + 1))
  window.dispatchEvent(new Event('storage'))
}

// SSR-safe external store for dismiss count
function subscribe(callback: () => void): () => void {
  window.addEventListener('storage', callback)
  return (): void => window.removeEventListener('storage', callback)
}

// ── Return type ───────────────────────────────

export type UsernameRepairState = {
  shouldShow: boolean
  isBlocking: boolean
  dismiss: () => void
}

// ── Hook ──────────────────────────────────────

export function useUsernameRepair(): UsernameRepairState {
  const { user, profile, isAuthenticated } = useAuth()
  const migrationComplete = useUserStore((s) => s.migrationPhaseComplete)
  // Session-level flag: once dismissed, stays hidden until component remounts
  const [dismissedThisMount, setDismissedThisMount] = useState(false)

  const userId = user?.id ?? ''

  const dismissCount = useSyncExternalStore(
    subscribe,
    () => getDismissCount(userId),
    () => 0,
  )

  const hasDefault = useMemo((): boolean => {
    if (!isAuthenticated || !profile || !userId) return false
    return isDefaultUsername(profile.username, userId)
  }, [isAuthenticated, profile, userId])

  const isBlocking = dismissCount >= DISMISS_THRESHOLD
  const shouldShow = hasDefault && migrationComplete && (isBlocking || !dismissedThisMount)

  const dismiss = useCallback((): void => {
    if (!userId || isBlocking) return
    incrementDismissCount(userId)
    setDismissedThisMount(true)
  }, [userId, isBlocking])

  return { shouldShow, isBlocking, dismiss }
}
