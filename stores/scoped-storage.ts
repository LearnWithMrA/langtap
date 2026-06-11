// ─────────────────────────────────────────────
// File: stores/scoped-storage.ts
// Purpose: User-scoped localStorage adapter for Zustand persist.
//          Prevents cross-user data leaks on shared browsers by
//          namespacing all persisted store keys with the current
//          user ID. Guest users use a '-guest' suffix.
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

// ── Auth change: clear + rehydrate ────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PersistStore = { persist: { rehydrate: () => void }; setState: (state: any) => void }

let registeredStores: Array<{ store: PersistStore; defaultState: Record<string, unknown> }> = []

export function registerScopedStore(
  store: PersistStore,
  defaultState: Record<string, unknown>,
): void {
  registeredStores.push({ store, defaultState })
}

export function resetStoresForAuthChange(): void {
  for (const { store, defaultState } of registeredStores) {
    store.setState({ ...defaultState, hasHydrated: false })
  }
}

export function clearRegisteredStores(): void {
  registeredStores = []
}

// ── Store names ─────────────────────────────

const STORE_NAMES = [
  'langtap-mastery',
  'langtap-word-mastery',
  'langtap-onboarding',
  'langtap-settings',
] as const

// ── Obsolete key sweep ────────────────────────

// One-time cleanup of localStorage keys left behind by removed features.
// Users cannot be expected to clear site storage themselves, so each time
// a feature that persisted data is retired, its keys are added here and
// STORAGE_SCHEMA_VERSION is bumped. The sweep runs once per version on
// app load (called from AuthInitializer) and deletes ONLY listed keys -
// never unknown ones, so future features and concurrent tabs stay safe.

const STORAGE_VERSION_KEY = 'langtap-storage-version'
export const STORAGE_SCHEMA_VERSION = 1

// Exact keys that are no longer read by any code.
// v1: guest trial system (Sprint 14) and pre-Sprint-10 unscoped store
// keys (the legacy import flow that read them was removed in Sprint 14).
const OBSOLETE_KEYS = [
  'langtap-guest-session-id',
  'langtap-guest-snapshot-marker',
  'langtap-mastery',
  'langtap-word-mastery',
  'langtap-onboarding',
  'langtap-settings',
] as const

// Key prefixes that are no longer read (suffixed by user ID or 'guest').
const OBSOLETE_KEY_PREFIXES = ['langtap-guest-distance', 'langtap-pending-import-'] as const

export function sweepObsoleteStorage(): void {
  try {
    const stored = Number(localStorage.getItem(STORAGE_VERSION_KEY) ?? '0')
    if (stored >= STORAGE_SCHEMA_VERSION) return

    const doomed: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key === null) continue
      const exact = (OBSOLETE_KEYS as readonly string[]).includes(key)
      const prefixed = OBSOLETE_KEY_PREFIXES.some((prefix) => key.startsWith(prefix))
      if (exact || prefixed) doomed.push(key)
    }
    // Collect first, remove second: removing while iterating shifts indices.
    for (const key of doomed) {
      localStorage.removeItem(key)
    }

    localStorage.setItem(STORAGE_VERSION_KEY, String(STORAGE_SCHEMA_VERSION))
  } catch {
    // localStorage unavailable (private mode, quota): skip silently.
    // The sweep is housekeeping, never load-bearing.
  }
}

// ── Dirty queue helpers (user-scoped) ─────────

export function clearDirtyQueues(userId: string): void {
  localStorage.removeItem(`langtap-dirty-mastery-${userId}`)
  localStorage.removeItem(`langtap-dirty-word-mastery-${userId}`)
}

// ── Full cleanup (for sign-out, delete account) ─

export function clearAllUserLocalStorage(userId: string): void {
  for (const name of STORE_NAMES) {
    localStorage.removeItem(`${name}-${userId}`)
  }
  localStorage.removeItem(`langtap-onboarding-${userId}`)
  clearDirtyQueues(userId)
}
