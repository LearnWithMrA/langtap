// ─────────────────────────────────────────────
// File: stores/guest-usage.store.ts
// Purpose: Shared Zustand store for server-side guest trial cap
//          state. All consumers (PracticeClient wrapper, inner
//          ActivePracticeClient, GuestBanner) read from this single
//          source so cap state updates propagate immediately.
//          Not persisted to localStorage; state comes from Supabase
//          RPCs and is hydrated by useGuestUsage on first access.
// Depends on: services/guest-usage.service.ts
// ─────────────────────────────────────────────

import { create } from 'zustand'
import type { GuestUsage } from '@/services/guest-usage.service'

// ── Types ─────────────────────────────────────

type GuestUsageState = {
  usage: GuestUsage | null
  isLoading: boolean
  isInitialized: boolean
}

type GuestUsageActions = {
  setUsage: (usage: GuestUsage | null) => void
  setLoading: (loading: boolean) => void
  markInitialized: () => void
  reset: () => void
}

type GuestUsageStore = GuestUsageState & GuestUsageActions

// ── Store ─────────────────────────────────────

export const useGuestUsageStore = create<GuestUsageStore>()((set) => ({
  usage: null,
  isLoading: true,
  isInitialized: false,

  setUsage: (usage: GuestUsage | null): void => {
    set({ usage })
  },

  setLoading: (loading: boolean): void => {
    set({ isLoading: loading })
  },

  markInitialized: (): void => {
    set({ isInitialized: true })
  },

  reset: (): void => {
    set({ usage: null, isLoading: true, isInitialized: false })
  },
}))
