// ─────────────────────────────────────────────
// File: stores/settings.store.ts
// Purpose: Zustand store for game settings and the settings dialog
//          open/close state. Persisted to localStorage for all users
//          (guests and authenticated). Supabase sync added in Sprint 8.
// Depends on: types/settings.types.ts
// ─────────────────────────────────────────────

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { InputDirection, AutoAdvance } from '@/types/settings.types'

// ── Types ─────────────────────────────────────

type SettingsState = {
  isSettingsOpen: boolean
  inputDirection: InputDirection
  mnemonics: boolean
  wordAudio: boolean
  keyClicks: boolean
  autoAdvance: AutoAdvance
}

type SettingsActions = {
  openSettings: () => void
  closeSettings: () => void
  setInputDirection: (direction: InputDirection) => void
  setMnemonics: (enabled: boolean) => void
  setWordAudio: (enabled: boolean) => void
  setKeyClicks: (enabled: boolean) => void
  setAutoAdvance: (mode: AutoAdvance) => void
}

// ── Store ─────────────────────────────────────

export const useSettingsStore = create<SettingsState & SettingsActions>()(
  persist(
    (set) => ({
      isSettingsOpen: false,
      inputDirection: 'alternate',
      mnemonics: true,
      wordAudio: true,
      keyClicks: false,
      autoAdvance: 'delayed',

      openSettings: (): void => {
        set({ isSettingsOpen: true })
      },

      closeSettings: (): void => {
        set({ isSettingsOpen: false })
      },

      setInputDirection: (direction: InputDirection): void => {
        set({ inputDirection: direction })
      },

      setMnemonics: (enabled: boolean): void => {
        set({ mnemonics: enabled })
      },

      setWordAudio: (enabled: boolean): void => {
        set({ wordAudio: enabled })
      },

      setKeyClicks: (enabled: boolean): void => {
        set({ keyClicks: enabled })
      },

      setAutoAdvance: (mode: AutoAdvance): void => {
        set({ autoAdvance: mode })
      },
    }),
    {
      name: 'langtap-settings',
      partialize: (state) => ({
        inputDirection: state.inputDirection,
        mnemonics: state.mnemonics,
        wordAudio: state.wordAudio,
        keyClicks: state.keyClicks,
        autoAdvance: state.autoAdvance,
      }),
    },
  ),
)
