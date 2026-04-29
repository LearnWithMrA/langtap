// ------------------------------------------------------------
// File: stores/counter.store.ts
// Purpose: Zustand store for word counter state.
//          Session-scoped: in-memory only, no persist middleware.
//          Counters exist to prevent repetition within a session.
//          Call resetAll() on session start for fresh counters.
//          bulkLoad() is replace-all for session resumption only.
// Depends on: engine/counter.ts, types/word.types.ts
// ------------------------------------------------------------

import { create } from 'zustand'
import { incrementWordCounter, resetCountersForCharacter } from '@/engine/counter'
import type { WordCounterMap } from '@/types/word.types'

// ── Types ────────────────────────────────────

type CounterState = {
  counters: WordCounterMap
}

type CounterActions = {
  increment: (wordId: string) => void
  resetForCharacter: (wordIds: string[]) => void
  bulkLoad: (counters: WordCounterMap) => void
  resetAll: () => void
  getCounter: (wordId: string) => number
}

// ── Store ────────────────────────────────────

export const useCounterStore = create<CounterState & CounterActions>()((set, get) => ({
  counters: {},

  increment: (wordId: string): void => {
    set((state) => ({
      counters: incrementWordCounter(state.counters, wordId),
    }))
  },

  resetForCharacter: (wordIds: string[]): void => {
    set((state) => ({
      counters: resetCountersForCharacter(state.counters, wordIds),
    }))
  },

  bulkLoad: (counters: WordCounterMap): void => {
    set({ counters })
  },

  resetAll: (): void => {
    set({ counters: {} })
  },

  getCounter: (wordId: string): number => {
    return get().counters[wordId] ?? 0
  },
}))
