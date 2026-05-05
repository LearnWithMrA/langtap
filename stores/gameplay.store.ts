// ─────────────────────────────────────────────
// File: stores/gameplay.store.ts
// Purpose: Lightweight signal for whether practice gameplay is
//          currently active (prompt visible and not completed).
//          Set by ActivePracticeClient on mount/unmount. Read by
//          prefetch and preloader to avoid network during play.
// Depends on: zustand
// ─────────────────────────────────────────────

import { create } from 'zustand'

type GameplayState = {
  isActive: boolean
  setActive: (active: boolean) => void
}

export const useGameplayStore = create<GameplayState>((set) => ({
  isActive: false,
  setActive: (active: boolean): void => set({ isActive: active }),
}))
