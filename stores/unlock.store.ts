// ─────────────────────────────────────────────
// File: stores/unlock.store.ts
// Purpose: Zustand store for character unlock state.
//          Derives unlocked set from mastery scores and manual unlocks.
//          Not persisted: recomputed from mastery store on hydration.
// Depends on: engine/unlock.ts, data/kana/characters.ts
// ─────────────────────────────────────────────

import { create } from 'zustand'
import { getUnlockedCharacterIds } from '@/engine/unlock'
import { KANA_CHARACTERS } from '@/data/kana/characters'
import type { MasteryScoreMap } from '@/types/game.types'

// ── Types ────────────────────────────────────

type UnlockState = {
  unlockedIds: Set<string>
  manualUnlocks: Set<string>
}

type UnlockActions = {
  recompute: (scores: MasteryScoreMap, manualUnlocks: Set<string>) => void
  addManualUnlock: (characterId: string) => void
  addManualUnlocks: (characterIds: readonly string[]) => void
}

// ── Store ────────────────────────────────────

const ALL_IDS = KANA_CHARACTERS.map((c) => c.id)

export const useUnlockStore = create<UnlockState & UnlockActions>()((set, get) => ({
  unlockedIds: new Set<string>(),
  manualUnlocks: new Set<string>(),

  recompute: (scores: MasteryScoreMap, manualUnlocks: Set<string>): void => {
    const unlocked = getUnlockedCharacterIds(ALL_IDS, scores, manualUnlocks)
    set({ unlockedIds: new Set(unlocked), manualUnlocks })
  },

  addManualUnlock: (characterId: string): void => {
    const state = get()
    const nextManual = new Set(state.manualUnlocks)
    nextManual.add(characterId)
    set({ manualUnlocks: nextManual })
  },

  addManualUnlocks: (characterIds: readonly string[]): void => {
    const state = get()
    const nextManual = new Set(state.manualUnlocks)
    for (const id of characterIds) nextManual.add(id)
    set({ manualUnlocks: nextManual })
  },
}))
