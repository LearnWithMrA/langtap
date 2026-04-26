// ─────────────────────────────────────────────
// File: stores/settings.store.ts
// Purpose: Zustand store for game settings and the settings dialog
//          open/close state. Persisted to localStorage for all users
//          (guests and authenticated). Supabase sync added in Sprint 8.
// Depends on: types/settings.types.ts
// ─────────────────────────────────────────────

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { InputMode, InputDirection, KotobaInput, AutoAdvance } from '@/types/settings.types'

// ── Types ─────────────────────────────────────

type SettingsState = {
  isSettingsOpen: boolean
  inputMode: InputMode
  inputDirection: InputDirection
  kotobaInput: KotobaInput
  mnemonics: boolean
  furigana: boolean
  wordAudio: boolean
  keyClicks: boolean
  autoAdvance: AutoAdvance
}

type SettingsActions = {
  openSettings: () => void
  closeSettings: () => void
  setInputMode: (mode: InputMode) => void
  setInputDirection: (direction: InputDirection) => void
  setKotobaInput: (input: KotobaInput) => void
  setMnemonics: (enabled: boolean) => void
  setFurigana: (enabled: boolean) => void
  setWordAudio: (enabled: boolean) => void
  setKeyClicks: (enabled: boolean) => void
  setAutoAdvance: (mode: AutoAdvance) => void
}

// ── Store ─────────────────────────────────────

export const useSettingsStore = create<SettingsState & SettingsActions>()(
  persist(
    (set) => ({
      isSettingsOpen: false,
      inputMode: 'tap',
      inputDirection: 'alternate',
      kotobaInput: 'readings',
      mnemonics: true,
      furigana: true,
      wordAudio: true,
      keyClicks: false,
      autoAdvance: 'delayed',

      openSettings: (): void => {
        set({ isSettingsOpen: true })
      },

      closeSettings: (): void => {
        set({ isSettingsOpen: false })
      },

      setInputMode: (mode: InputMode): void => {
        set({ inputMode: mode })
      },

      setInputDirection: (direction: InputDirection): void => {
        set({ inputDirection: direction })
      },

      setKotobaInput: (input: KotobaInput): void => {
        set({ kotobaInput: input })
      },

      setMnemonics: (enabled: boolean): void => {
        set({ mnemonics: enabled })
      },

      setFurigana: (enabled: boolean): void => {
        set({ furigana: enabled })
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
        inputMode: state.inputMode,
        inputDirection: state.inputDirection,
        kotobaInput: state.kotobaInput,
        mnemonics: state.mnemonics,
        furigana: state.furigana,
        wordAudio: state.wordAudio,
        keyClicks: state.keyClicks,
        autoAdvance: state.autoAdvance,
      }),
    },
  ),
)
