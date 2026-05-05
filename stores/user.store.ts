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
}

type UserActions = {
  setUser: (user: AuthUser | null) => void
  setProfile: (profile: UserProfile | null) => void
  setLoading: (loading: boolean) => void
  setProfileLoaded: (loaded: boolean) => void
  clear: () => void
}

export type UserStore = UserState & UserActions

// ── Store ─────────────────────────────────────

export const useUserStore = create<UserStore>()((set) => ({
  user: null,
  profile: null,
  isLoading: true,
  isProfileLoaded: false,

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

  clear: (): void => {
    set({ user: null, profile: null, isProfileLoaded: false })
  },
}))
