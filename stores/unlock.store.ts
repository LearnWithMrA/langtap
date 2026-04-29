// ─────────────────────────────────────────────
// File: stores/unlock.store.ts
// Purpose: Zustand store for character unlock state.
//          Derives unlocked set from mastery scores and manual unlocks.
//          Not persisted: recomputed from mastery store on hydration.
//          Provides bootstrap() for app startup: auto-unlocks first
//          progression group when no characters are unlocked.
//          Provides allKanaUnlocked selector for Kotoba lock gate.
// Depends on: engine/unlock.ts, data/kana/characters.ts,
//             data/kana/progression-groups.ts
// ─────────────────────────────────────────────

import { create } from 'zustand'
import { getUnlockedCharacterIds } from '@/engine/unlock'
import { KANA_CHARACTERS } from '@/data/kana/characters'
import { PROGRESSION_GROUPS } from '@/data/kana/progression-groups'
import { useMasteryStore } from '@/stores/mastery.store'
import type { MasteryScoreMap } from '@/types/game.types'

// ── Constants ────────────────────────────────

const ALL_IDS = KANA_CHARACTERS.map((c) => c.id)

const SPECIAL_ROWS = new Set(['sokuon', 'longvowel'])
const DOJO_CHARACTER_COUNT = KANA_CHARACTERS.filter((c) => !SPECIAL_ROWS.has(c.row)).length

const FIRST_GROUP_IDS = PROGRESSION_GROUPS.filter(
  (g) => g.stage === 'seion' && g.groupIndex === 1,
).flatMap((g) => [...g.characterIds])

// ── Types ────────────────────────────────────

type UnlockState = {
  unlockedIds: Set<string>
  manualUnlocks: Set<string>
  allKanaUnlocked: boolean
  bootstrapped: boolean
}

type UnlockActions = {
  recompute: (scores: MasteryScoreMap, manualUnlocks: Set<string>) => void
  bootstrap: (scores: MasteryScoreMap, manualUnlockIds: readonly string[]) => readonly string[]
  addManualUnlock: (characterId: string) => void
  addManualUnlocks: (characterIds: readonly string[]) => void
}

// ── Store ────────────────────────────────────

export const useUnlockStore = create<UnlockState & UnlockActions>()((set, get) => ({
  unlockedIds: new Set<string>(),
  manualUnlocks: new Set<string>(),
  allKanaUnlocked: false,
  bootstrapped: false,

  recompute: (scores: MasteryScoreMap, manualUnlocks: Set<string>): void => {
    const unlocked = getUnlockedCharacterIds(ALL_IDS, scores, manualUnlocks)
    const unlockedSet = new Set(unlocked)
    const nonSpecialUnlocked = KANA_CHARACTERS.filter(
      (c) => !SPECIAL_ROWS.has(c.row) && unlockedSet.has(c.id),
    ).length
    set({
      unlockedIds: unlockedSet,
      manualUnlocks,
      allKanaUnlocked: nonSpecialUnlocked >= DOJO_CHARACTER_COUNT,
    })
  },

  bootstrap: (scores: MasteryScoreMap, manualUnlockIds: readonly string[]): readonly string[] => {
    const manual = new Set(manualUnlockIds)
    const unlocked = getUnlockedCharacterIds(ALL_IDS, scores, manual)

    if (unlocked.size === 0) {
      for (const id of FIRST_GROUP_IDS) manual.add(id)
    }

    const finalUnlocked = getUnlockedCharacterIds(ALL_IDS, scores, manual)
    const unlockedSet = new Set(finalUnlocked)
    const nonSpecialUnlocked = KANA_CHARACTERS.filter(
      (c) => !SPECIAL_ROWS.has(c.row) && unlockedSet.has(c.id),
    ).length

    set({
      unlockedIds: unlockedSet,
      manualUnlocks: manual,
      allKanaUnlocked: nonSpecialUnlocked >= DOJO_CHARACTER_COUNT,
      bootstrapped: true,
    })

    return [...manual]
  },

  addManualUnlock: (characterId: string): void => {
    const state = get()
    const nextManual = new Set(state.manualUnlocks)
    nextManual.add(characterId)
    get().recompute(useMasteryStore.getState().scores, nextManual)
  },

  addManualUnlocks: (characterIds: readonly string[]): void => {
    const state = get()
    const nextManual = new Set(state.manualUnlocks)
    for (const id of characterIds) nextManual.add(id)
    get().recompute(useMasteryStore.getState().scores, nextManual)
  },
}))
