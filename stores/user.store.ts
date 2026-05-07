// ------------------------------------------------------------
// File: stores/user.store.ts
// Purpose: Zustand store for authenticated user state.
//          Holds the current auth user and profile. null when guest.
//          Not persisted to localStorage; auth state comes from
//          Supabase session cookies and is hydrated on mount.
// Depends on: types/user.types.ts
// ------------------------------------------------------------

import { create } from 'zustand'
import type { AuthUser, UserProfile } from '@/types/user.types'

// ── Types ─────────────────────────────────────

type UserState = {
  user: AuthUser | null
  profile: UserProfile | null
  isLoading: boolean
  isProfileLoaded: boolean
  isServerHydrated: boolean
  migrationPhaseComplete: boolean
  pendingGuestImport: boolean
  showGuestImportPrompt: boolean
  showLegacyImportPrompt: boolean
}

type UserActions = {
  setUser: (user: AuthUser | null) => void
  setProfile: (profile: UserProfile | null) => void
  setLoading: (loading: boolean) => void
  setProfileLoaded: (loaded: boolean) => void
  setServerHydrated: (hydrated: boolean) => void
  setMigrationPhaseComplete: (complete: boolean) => void
  setPendingGuestImport: (pending: boolean) => void
  setShowGuestImportPrompt: (show: boolean) => void
  setShowLegacyImportPrompt: (show: boolean) => void
  clear: () => void
}

export type UserStore = UserState & UserActions

// ── Store ─────────────────────────────────────

export const useUserStore = create<UserStore>()((set) => ({
  user: null,
  profile: null,
  isLoading: true,
  isProfileLoaded: false,
  isServerHydrated: false,
  migrationPhaseComplete: false,
  pendingGuestImport: false,
  showGuestImportPrompt: false,
  showLegacyImportPrompt: false,

  setUser: (user: AuthUser | null): void => {
    set({ user })
  },

  setProfile: (profile: UserProfile | null): void => {
    set({ profile, isProfileLoaded: profile !== null })
  },

  setLoading: (loading: boolean): void => {
    set({ isLoading: loading })
  },

  setProfileLoaded: (loaded: boolean): void => {
    set({ isProfileLoaded: loaded })
  },

  setServerHydrated: (hydrated: boolean): void => {
    set({ isServerHydrated: hydrated })
  },

  setMigrationPhaseComplete: (complete: boolean): void => {
    set({ migrationPhaseComplete: complete })
  },

  setPendingGuestImport: (pending: boolean): void => {
    set({ pendingGuestImport: pending })
  },

  setShowGuestImportPrompt: (show: boolean): void => {
    set({ showGuestImportPrompt: show })
  },

  setShowLegacyImportPrompt: (show: boolean): void => {
    set({ showLegacyImportPrompt: show })
  },

  clear: (): void => {
    set({
      user: null,
      profile: null,
      isProfileLoaded: false,
      isServerHydrated: false,
      migrationPhaseComplete: false,
      pendingGuestImport: false,
      showGuestImportPrompt: false,
      showLegacyImportPrompt: false,
    })
  },
}))
