// ─────────────────────────────────────────────
// File: stores/scoped-storage.ts
// Purpose: User-scoped localStorage adapter for Zustand persist.
//          Prevents cross-user data leaks on shared browsers by
//          namespacing all persisted store keys with the current
//          user ID. Guest users use a '-guest' suffix.
//          Legacy global keys (pre-Sprint 10) are detected but
//          NOT auto-migrated. The import flow handles them.
// Depends on: zustand/middleware (persist types)
// ─────────────────────────────────────────────

import type { PersistStorage, StorageValue } from 'zustand/middleware'

// ── Constants ─────────────────────────────────

const GUEST_SUFFIX = 'guest'

// ── Scoped key ────────────────────────────────

let currentUserId: string | null = null

export function setStorageUserId(userId: string | null): void {
  currentUserId = userId
}

export function getStorageUserId(): string | null {
  return currentUserId
}

function scopedKey(baseName: string): string {
  const suffix = currentUserId ?? GUEST_SUFFIX
  return `${baseName}-${suffix}`
}

// ── PersistStorage adapter ────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createScopedStorage(_baseName: string): PersistStorage<any> {
  return {
    getItem: (name: string): StorageValue<unknown> | null => {
      const key = scopedKey(name)
      const raw = localStorage.getItem(key)
      if (raw === null) return null
      return JSON.parse(raw) as StorageValue<unknown>
    },
    setItem: (name: string, value: StorageValue<unknown>): void => {
      const key = scopedKey(name)
      localStorage.setItem(key, JSON.stringify(value))
    },
    removeItem: (name: string): void => {
      const key = scopedKey(name)
      localStorage.removeItem(key)
    },
  }
}

// ── Legacy key detection ──────────────────────

const LEGACY_STORE_NAMES = [
  'langtap-mastery',
  'langtap-word-mastery',
  'langtap-onboarding',
  'langtap-settings',
  'langtap-guest-distance',
] as const

export function hasLegacyGlobalKeys(): boolean {
  return LEGACY_STORE_NAMES.some((name) => localStorage.getItem(name) !== null)
}

export function readLegacyGlobalKeys(): Record<string, string> {
  const result: Record<string, string> = {}
  for (const name of LEGACY_STORE_NAMES) {
    const value = localStorage.getItem(name)
    if (value !== null) {
      result[name] = value
    }
  }
  return result
}

export function deleteLegacyGlobalKeys(): void {
  for (const name of LEGACY_STORE_NAMES) {
    localStorage.removeItem(name)
  }
}

// ── Guest key helpers ─────────────────────────

const GAME_STORE_NAMES = [
  'langtap-mastery',
  'langtap-word-mastery',
  'langtap-settings',
  'langtap-guest-distance',
] as const

export function hasGuestKeys(): boolean {
  return GAME_STORE_NAMES.some((name) => localStorage.getItem(`${name}-${GUEST_SUFFIX}`) !== null)
}

export function readGuestKeys(): Record<string, string> {
  const result: Record<string, string> = {}
  for (const name of GAME_STORE_NAMES) {
    const key = `${name}-${GUEST_SUFFIX}`
    const value = localStorage.getItem(key)
    if (value !== null) {
      result[name] = value
    }
  }
  return result
}

export function deleteGuestKeys(): void {
  for (const name of GAME_STORE_NAMES) {
    localStorage.removeItem(`${name}-${GUEST_SUFFIX}`)
  }
}

// ── Pending key helpers ───────────────────────

export function moveToPendingKeys(userId: string): void {
  for (const name of GAME_STORE_NAMES) {
    const guestKey = `${name}-${GUEST_SUFFIX}`
    const pendingKey = `${name}-pending-${userId}`
    const value = localStorage.getItem(guestKey)
    if (value !== null) {
      localStorage.setItem(pendingKey, value)
      localStorage.removeItem(guestKey)
    }
  }
}

export function hasPendingKeys(userId: string): boolean {
  return GAME_STORE_NAMES.some((name) => localStorage.getItem(`${name}-pending-${userId}`) !== null)
}

export function readPendingKeys(userId: string): Record<string, string> {
  const result: Record<string, string> = {}
  for (const name of GAME_STORE_NAMES) {
    const key = `${name}-pending-${userId}`
    const value = localStorage.getItem(key)
    if (value !== null) {
      result[name] = value
    }
  }
  return result
}

export function deletePendingKeys(userId: string): void {
  for (const name of GAME_STORE_NAMES) {
    localStorage.removeItem(`${name}-pending-${userId}`)
  }
}

// ── Session marker ────────────────────────────

const GUEST_SESSION_MARKER_KEY = 'langtap-guest-session-id'

export function setGuestSessionMarker(sessionId: string): void {
  sessionStorage.setItem(GUEST_SESSION_MARKER_KEY, sessionId)
}

export function getGuestSessionMarker(): string | null {
  return sessionStorage.getItem(GUEST_SESSION_MARKER_KEY)
}

export function clearGuestSessionMarker(): void {
  sessionStorage.removeItem(GUEST_SESSION_MARKER_KEY)
}

// ── Pending import flag ───────────────────────

export function setPendingGuestImport(userId: string): void {
  localStorage.setItem(`langtap-pending-import-${userId}`, 'true')
}

export function hasPendingGuestImport(userId: string): boolean {
  return localStorage.getItem(`langtap-pending-import-${userId}`) === 'true'
}

export function clearPendingGuestImport(userId: string): void {
  localStorage.removeItem(`langtap-pending-import-${userId}`)
}

// ── Dirty queue helpers (user-scoped) ─────────

export function clearDirtyQueues(userId: string): void {
  localStorage.removeItem(`langtap-dirty-mastery-${userId}`)
  localStorage.removeItem(`langtap-dirty-word-mastery-${userId}`)
}

// ── Full cleanup (for sign-out, delete account) ─

export function clearAllUserLocalStorage(userId: string): void {
  for (const name of GAME_STORE_NAMES) {
    localStorage.removeItem(`${name}-${userId}`)
  }
  localStorage.removeItem(`langtap-onboarding-${userId}`)
  clearDirtyQueues(userId)
  clearPendingGuestImport(userId)
  deletePendingKeys(userId)
}
