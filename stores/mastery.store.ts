// ------------------------------------------------------------
// File: stores/mastery.store.ts
// Purpose: Zustand store for character mastery scores.
//          State: all kana characters with their mastery scores.
//          Actions: increment on correct answer, read score, reset.
//          Persisted to localStorage for guests. Supabase sync
//          handled by the hook/service layer, not this store.
// Depends on: types/game.types.ts, zustand
// ------------------------------------------------------------

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { MasteryScoreMap } from '@/types/game.types'

// ── Types ────────────────────────────────────

type MasteryState = {
  scores: MasteryScoreMap
  hasHydrated: boolean
}

type MasteryActions = {
  increment: (characterId: string) => void
  bulkLoad: (incoming: MasteryScoreMap) => void
  reset: (characterId: string) => void
  resetAll: () => void
  getScore: (characterId: string) => number
  hasEncountered: (characterId: string) => boolean
  setHasHydrated: (hydrated: boolean) => void
}

// ── Helpers ──────────────────────────────────

// Mastery score invariant: finite integer >= 0.
function sanitizeScore(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0
  return Math.floor(value)
}

// ── Store ────────────────────────────────────

export const useMasteryStore = create<MasteryState & MasteryActions>()(
  persist(
    (set, get) => ({
      scores: {},
      hasHydrated: false,

      increment: (characterId: string): void => {
        set((state) => {
          const current = state.scores[characterId] ?? 0
          return { scores: { ...state.scores, [characterId]: current + 1 } }
        })
      },

      bulkLoad: (incoming: MasteryScoreMap): void => {
        set((state) => {
          const merged = { ...state.scores }
          for (const [key, value] of Object.entries(incoming)) {
            const sanitized = sanitizeScore(value)
            const existing = merged[key] ?? 0
            merged[key] = Math.max(existing, sanitized)
          }
          return { scores: merged }
        })
      },

      reset: (characterId: string): void => {
        set((state) => ({
          scores: { ...state.scores, [characterId]: 0 },
        }))
      },

      resetAll: (): void => {
        set({ scores: {} })
      },

      getScore: (characterId: string): number => {
        return get().scores[characterId] ?? 0
      },

      hasEncountered: (characterId: string): boolean => {
        return (get().scores[characterId] ?? 0) > 0
      },

      setHasHydrated: (hydrated: boolean): void => {
        set({ hasHydrated: hydrated })
      },
    }),
    {
      name: 'langtap-mastery',
      version: 1,
      migrate: (persistedState: unknown, _version: number): MasteryState & MasteryActions => {
        return persistedState as MasteryState & MasteryActions
      },
      skipHydration: true,
      partialize: (state) => ({
        scores: state.scores,
      }),
      onRehydrateStorage: () => {
        return (_state, error): void => {
          if (!error) {
            useMasteryStore.setState({ hasHydrated: true })
          }
        }
      },
    },
  ),
)
