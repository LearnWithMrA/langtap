// ─────────────────────────────────────────────
// File: stores/daily-cap.store.ts
// Purpose: Shared Zustand store for daily distance cap state.
//          Both PracticeClient (gate) and ActivePracticeClient
//          (increment) read from the same store so cap transitions
//          propagate to the gate immediately.
// Depends on: nothing (pure state container)
// ─────────────────────────────────────────────

import { create } from 'zustand'

// ── Types ─────────────────────────────────────

export type DailyCapState = {
  totalToday: number
  isCapped: boolean
  capAmount: number
  capEnabled: boolean
}

type DailyCapStore = {
  capState: DailyCapState | null
  isLoading: boolean
  isInitialized: boolean
  setCapState: (state: DailyCapState) => void
  setLoading: (loading: boolean) => void
  markInitialized: () => void
  reset: () => void
}

// ── Store ─────────────────────────────────────

export const useDailyCapStore = create<DailyCapStore>((set) => ({
  capState: null,
  isLoading: true,
  isInitialized: false,
  setCapState: (capState): void => set({ capState }),
  setLoading: (isLoading): void => set({ isLoading }),
  markInitialized: (): void => set({ isInitialized: true }),
  reset: (): void => set({ capState: null, isLoading: true, isInitialized: false }),
}))
