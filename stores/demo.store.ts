// ─────────────────────────────────────────────
// File: stores/demo.store.ts
// Purpose: In-memory state for the demo taster experience. Tracks
//          prompt index per game type and completion status. Not
//          persisted to localStorage (demo resets on page refresh).
//          Clicking "Try it out" again calls reset() to restart.
// Depends on: zustand, data/demo/demo-prompts.ts
// ─────────────────────────────────────────────

import { create } from 'zustand'
import { DEMO_KANA_PROMPT_COUNT, DEMO_KOTOBA_PROMPT_COUNT } from '@/data/demo/demo-prompts'

// ── Types ────────────────────────────────────

type DemoState = {
  isActive: boolean
  kanaIndex: number
  kotobaIndex: number
  isKanaComplete: boolean
  isKotobaComplete: boolean
  activate: () => void
  advanceKana: () => void
  advanceKotoba: () => void
  reset: () => void
}

// ── Store ────────────────────────────────────

export const useDemoStore = create<DemoState>((set) => ({
  isActive: false,
  kanaIndex: 0,
  kotobaIndex: 0,
  isKanaComplete: false,
  isKotobaComplete: false,

  activate: (): void => set({ isActive: true }),

  advanceKana: (): void =>
    set((state) => {
      const next = state.kanaIndex + 1
      return {
        kanaIndex: next,
        isKanaComplete: next >= DEMO_KANA_PROMPT_COUNT,
      }
    }),

  advanceKotoba: (): void =>
    set((state) => {
      const next = state.kotobaIndex + 1
      return {
        kotobaIndex: next,
        isKotobaComplete: next >= DEMO_KOTOBA_PROMPT_COUNT,
      }
    }),

  reset: (): void =>
    set({
      isActive: true,
      kanaIndex: 0,
      kotobaIndex: 0,
      isKanaComplete: false,
      isKotobaComplete: false,
    }),
}))
