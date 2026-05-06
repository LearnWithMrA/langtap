// ------------------------------------------------------------
// File: stores/word-mastery.store.ts
// Purpose: Zustand store for word mastery scores and manual unlocks.
//          State: per-word scores + manually unlocked word IDs.
//          Actions: increment, setScore, reset (preserves manual
//          unlock so tiles stay visible at 0), addManualUnlock,
//          addManualUnlocks.
//          Persisted to localStorage for guests. Supabase sync
//          handled by the hook/service layer, not this store.
//
//          Manual unlock contract:
//          - addManualUnlock/addManualUnlocks are additive-only.
//          - reset(wordId) clears the score to 0 AND adds the word
//            to manuallyUnlockedWords so the tile stays unlocked
//            (visible at score 0, not padlocked).
//          - resetAll() clears both scores and manual unlocks.
// Depends on: types/word.types.ts, zustand
// ------------------------------------------------------------

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { WordMasteryScoreMap } from '@/types/word.types'
import { createScopedStorage, registerScopedStore } from '@/stores/scoped-storage'

// ── Types ────────────────────────────────────

type WordMasteryState = {
  scores: WordMasteryScoreMap
  manuallyUnlockedWords: readonly string[]
  hasHydrated: boolean
}

type WordMasteryActions = {
  increment: (wordId: string) => void
  setScore: (wordId: string, score: number) => void
  bulkLoad: (incoming: WordMasteryScoreMap) => void
  reset: (wordId: string) => void
  resetAll: () => void
  getScore: (wordId: string) => number
  hasEncountered: (wordId: string) => boolean
  addManualUnlock: (wordId: string) => void
  addManualUnlocks: (wordIds: readonly string[]) => void
  setHasHydrated: (hydrated: boolean) => void
}

// ── Helpers ──────────────────────────────────

function sanitizeScore(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0
  return Math.floor(value)
}

function addToUnlockList(
  existing: readonly string[],
  incoming: readonly string[],
): readonly string[] {
  const set = new Set(existing)
  let changed = false
  for (const id of incoming) {
    if (!set.has(id)) {
      set.add(id)
      changed = true
    }
  }
  return changed ? [...set] : existing
}

// ── Store ────────────────────────────────────

export const useWordMasteryStore = create<WordMasteryState & WordMasteryActions>()(
  persist(
    (set, get) => ({
      scores: {},
      manuallyUnlockedWords: [],
      hasHydrated: false,

      increment: (wordId: string): void => {
        set((state) => {
          const current = state.scores[wordId] ?? 0
          return { scores: { ...state.scores, [wordId]: current + 1 } }
        })
      },

      setScore: (wordId: string, score: number): void => {
        const sanitized = sanitizeScore(score)
        set((state) => ({
          scores: { ...state.scores, [wordId]: sanitized },
        }))
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
          manuallyUnlockedWords: addToUnlockList(state.manuallyUnlockedWords, [wordId]),
        }))
      },

      resetAll: (): void => {
        set({ scores: {}, manuallyUnlockedWords: [] })
      },

      getScore: (wordId: string): number => {
        return get().scores[wordId] ?? 0
      },

      hasEncountered: (wordId: string): boolean => {
        return (get().scores[wordId] ?? 0) > 0
      },

      addManualUnlock: (wordId: string): void => {
        set((state) => ({
          manuallyUnlockedWords: addToUnlockList(state.manuallyUnlockedWords, [wordId]),
        }))
      },

      addManualUnlocks: (wordIds: readonly string[]): void => {
        set((state) => ({
          manuallyUnlockedWords: addToUnlockList(state.manuallyUnlockedWords, wordIds),
        }))
      },

      setHasHydrated: (hydrated: boolean): void => {
        set({ hasHydrated: hydrated })
      },
    }),
    {
      name: 'langtap-word-mastery',
      storage: createScopedStorage('langtap-word-mastery'),
      version: 2,
      migrate: (
        persistedState: unknown,
        version: number,
      ): WordMasteryState & WordMasteryActions => {
        const state = persistedState as Record<string, unknown>
        if (version < 2) {
          if (!Array.isArray(state['manuallyUnlockedWords'])) {
            state['manuallyUnlockedWords'] = []
          }
        }
        return state as unknown as WordMasteryState & WordMasteryActions
      },
      skipHydration: true,
      partialize: (state) => ({
        scores: state.scores,
        manuallyUnlockedWords: state.manuallyUnlockedWords,
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

registerScopedStore(useWordMasteryStore, { scores: {}, manuallyUnlockedWords: [] })
