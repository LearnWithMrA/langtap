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
import { createScopedStorage, registerScopedStore } from '@/stores/scoped-storage'

// ── Types ────────────────────────────────────

type MasteryState = {
  scores: MasteryScoreMap
  learningScores: MasteryScoreMap
  epoch: number
  hasHydrated: boolean
  dirtyVersions: Map<string, number>
  dirtyUnlockIds: Set<string>
}

type MasteryActions = {
  increment: (characterId: string) => void
  incrementLearning: (characterId: string) => void
  bulkLoad: (incoming: MasteryScoreMap) => void
  bulkLoadLearning: (incoming: MasteryScoreMap) => void
  replaceAll: (scores: MasteryScoreMap, learningScores: MasteryScoreMap, epoch: number) => void
  setEpoch: (epoch: number) => void
  reset: (characterId: string) => void
  resetAll: () => void
  getScore: (characterId: string) => number
  getLearningScore: (characterId: string) => number
  hasEncountered: (characterId: string) => boolean
  setHasHydrated: (hydrated: boolean) => void
  markUnlockDirty: (characterId: string) => void
  getDirtyScoreSnapshot: () => Array<{
    character_id: string
    score: number
    learning_score: number
  }>
  getDirtyUnlockIds: () => string[]
  clearDirtyIfMatch: (entries: Map<string, number>) => void
  clearDirtyUnlocks: (ids: string[]) => void
  clearAllDirty: () => void
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
      learningScores: {},
      epoch: 0,
      hasHydrated: false,
      dirtyVersions: new Map(),
      dirtyUnlockIds: new Set(),

      incrementLearning: (characterId: string): void => {
        set((state) => {
          const current = state.learningScores[characterId] ?? 0
          if (current >= 5) return state
          const newDirty = new Map(state.dirtyVersions)
          newDirty.set(characterId, (newDirty.get(characterId) ?? 0) + 1)
          return {
            learningScores: { ...state.learningScores, [characterId]: current + 1 },
            dirtyVersions: newDirty,
          }
        })
      },

      increment: (characterId: string): void => {
        set((state) => {
          const current = state.scores[characterId] ?? 0
          const newDirty = new Map(state.dirtyVersions)
          newDirty.set(characterId, (newDirty.get(characterId) ?? 0) + 1)
          return {
            scores: { ...state.scores, [characterId]: current + 1 },
            dirtyVersions: newDirty,
          }
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

      bulkLoadLearning: (incoming: MasteryScoreMap): void => {
        set((state) => {
          const merged = { ...state.learningScores }
          for (const [key, value] of Object.entries(incoming)) {
            const sanitized = Math.min(sanitizeScore(value), 5)
            const existing = merged[key] ?? 0
            merged[key] = Math.max(existing, sanitized)
          }
          return { learningScores: merged }
        })
      },

      replaceAll: (
        scores: MasteryScoreMap,
        learningScores: MasteryScoreMap,
        epoch: number,
      ): void => {
        set({ scores, learningScores, epoch })
      },

      setEpoch: (epoch: number): void => {
        set({ epoch })
      },

      reset: (characterId: string): void => {
        set((state) => {
          const newDirty = new Map(state.dirtyVersions)
          newDirty.delete(characterId)
          return {
            scores: { ...state.scores, [characterId]: 0 },
            learningScores: { ...state.learningScores, [characterId]: 0 },
            dirtyVersions: newDirty,
          }
        })
      },

      resetAll: (): void => {
        set({ scores: {}, learningScores: {}, dirtyVersions: new Map(), dirtyUnlockIds: new Set() })
      },

      getScore: (characterId: string): number => {
        return get().scores[characterId] ?? 0
      },

      getLearningScore: (characterId: string): number => {
        return get().learningScores[characterId] ?? 0
      },

      hasEncountered: (characterId: string): boolean => {
        return (get().scores[characterId] ?? 0) > 0
      },

      setHasHydrated: (hydrated: boolean): void => {
        set({ hasHydrated: hydrated })
      },

      markUnlockDirty: (characterId: string): void => {
        set((state) => {
          const newSet = new Set(state.dirtyUnlockIds)
          newSet.add(characterId)
          return { dirtyUnlockIds: newSet }
        })
      },

      getDirtyScoreSnapshot: (): Array<{
        character_id: string
        score: number
        learning_score: number
      }> => {
        const state = get()
        const rows: Array<{ character_id: string; score: number; learning_score: number }> = []
        for (const [id] of state.dirtyVersions) {
          rows.push({
            character_id: id,
            score: state.scores[id] ?? 0,
            learning_score: state.learningScores[id] ?? 0,
          })
        }
        return rows
      },

      getDirtyUnlockIds: (): string[] => {
        return [...get().dirtyUnlockIds]
      },

      clearDirtyIfMatch: (entries: Map<string, number>): void => {
        set((state) => {
          const newDirty = new Map(state.dirtyVersions)
          for (const [id, syncedVersion] of entries) {
            if (newDirty.get(id) === syncedVersion) {
              newDirty.delete(id)
            }
          }
          return { dirtyVersions: newDirty }
        })
      },

      clearDirtyUnlocks: (ids: string[]): void => {
        set((state) => {
          const newSet = new Set(state.dirtyUnlockIds)
          for (const id of ids) newSet.delete(id)
          return { dirtyUnlockIds: newSet }
        })
      },

      clearAllDirty: (): void => {
        set({ dirtyVersions: new Map(), dirtyUnlockIds: new Set() })
      },
    }),
    {
      name: 'langtap-mastery',
      storage: createScopedStorage('langtap-mastery'),
      version: 2,
      migrate: (persistedState: unknown, version: number): Partial<MasteryState> => {
        const state = persistedState as Partial<MasteryState>
        if (version < 2) {
          const backfilled: Record<string, number> = {}
          if (state.scores) {
            for (const [id, score] of Object.entries(state.scores)) {
              if (score > 0) backfilled[id] = Math.min(score, 5)
            }
          }
          return { ...state, learningScores: backfilled }
        }
        return state as MasteryState
      },
      skipHydration: true,
      partialize: (state) => ({
        scores: state.scores,
        learningScores: state.learningScores,
        epoch: state.epoch,
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

registerScopedStore(useMasteryStore, {
  scores: {},
  learningScores: {},
  epoch: 0,
  dirtyVersions: new Map(),
  dirtyUnlockIds: new Set(),
})
