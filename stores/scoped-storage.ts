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
