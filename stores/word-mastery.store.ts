// ------------------------------------------------------------
// File: stores/word-mastery.store.ts
// Purpose: Zustand store for word mastery scores.
//          State: all words with their mastery scores.
//          Actions: increment on correct answer, read score, reset.
//          Persisted to localStorage for guests. Supabase sync
//          handled by the hook/service layer, not this store.
// Depends on: types/word.types.ts, zustand
// ------------------------------------------------------------

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { WordMasteryScoreMap } from '@/types/word.types'

// ── Types ────────────────────────────────────

type WordMasteryState = {
  scores: WordMasteryScoreMap
  hasHydrated: boolean
}

type WordMasteryActions = {
  increment: (wordId: string) => void
  bulkLoad: (incoming: WordMasteryScoreMap) => void
  reset: (wordId: string) => void
  resetAll: () => void
  getScore: (wordId: string) => number
  hasEncountered: (wordId: string) => boolean
  setHasHydrated: (hydrated: boolean) => void
}

// ── Helpers ──────────────────────────────────

function sanitizeScore(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0
  return Math.floor(value)
}

// ── Store ────────────────────────────────────

export const useWordMasteryStore = create<WordMasteryState & WordMasteryActions>()(
  persist(
    (set, get) => ({
      scores: {},
      hasHydrated: false,

      increment: (wordId: string): void => {
        set((state) => {
          const current = state.scores[wordId] ?? 0
          return { scores: { ...state.scores, [wordId]: current + 1 } }
        })
      },

      bulkLoad: (incoming: WordMasteryScoreMap): void => {
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

      reset: (wordId: string): void => {
        set((state) => ({
          scores: { ...state.scores, [wordId]: 0 },
        }))
      },

      resetAll: (): void => {
        set({ scores: {} })
      },

      getScore: (wordId: string): number => {
        return get().scores[wordId] ?? 0
      },

      hasEncountered: (wordId: string): boolean => {
        return (get().scores[wordId] ?? 0) > 0
      },

      setHasHydrated: (hydrated: boolean): void => {
        set({ hasHydrated: hydrated })
      },
    }),
    {
      name: 'langtap-word-mastery',
      version: 1,
      migrate: (
        persistedState: unknown,
        _version: number,
      ): WordMasteryState & WordMasteryActions => {
        return persistedState as WordMasteryState & WordMasteryActions
      },
      skipHydration: true,
      partialize: (state) => ({
        scores: state.scores,
      }),
      onRehydrateStorage: () => {
        return (_state, error): void => {
          if (!error) {
            useWordMasteryStore.setState({ hasHydrated: true })
          }
        }
      },
    },
  ),
)
