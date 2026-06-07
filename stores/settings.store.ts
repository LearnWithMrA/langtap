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
import { createScopedStorage, registerScopedStore, getStorageUserId } from '@/stores/scoped-storage'
import { updateProfile } from '@/services/profile.service'

// ── Types ─────────────────────────────────────

type SettingsState = {
  isSettingsOpen: boolean
  inputMode: InputMode
  inputDirection: InputDirection
  kotobaInput: KotobaInput
  hints: boolean
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
  setHints: (enabled: boolean) => void
  setFurigana: (enabled: boolean) => void
  setWordAudio: (enabled: boolean) => void
  setKeyClicks: (enabled: boolean) => void
  setAutoAdvance: (mode: AutoAdvance) => void
  hydrateFromProfile: (profile: {
    inputMode: InputMode
    inputDirection: string
    kotobaInput: string
    hintsEnabled: boolean
    furiganaEnabled: boolean
    wordAudioEnabled: boolean
    keyClicksEnabled: boolean
    autoAdvance: string
  }) => void
}

// ── Server sync helper ───────────────────────

function syncToServer(updates: Record<string, unknown>): void {
  const userId = getStorageUserId()
  if (!userId) return
  void updateProfile(userId, updates)
}

// ── Store ─────────────────────────────────────

export const useSettingsStore = create<SettingsState & SettingsActions>()(
  persist(
    (set) => ({
      isSettingsOpen: false,
      inputMode: 'tap',
      inputDirection: 'alternate',
      kotobaInput: 'readings',
      hints: true,
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
        syncToServer({ input_mode: mode })
      },

      setInputDirection: (direction: InputDirection): void => {
        set({ inputDirection: direction })
        syncToServer({ input_direction: direction })
      },

      setKotobaInput: (input: KotobaInput): void => {
        set({ kotobaInput: input })
        syncToServer({ kotoba_input: input })
      },

      setHints: (enabled: boolean): void => {
        set({ hints: enabled })
        syncToServer({ hints_enabled: enabled })
      },

      setFurigana: (enabled: boolean): void => {
        set({ furigana: enabled })
        syncToServer({ furigana_enabled: enabled })
      },

      setWordAudio: (enabled: boolean): void => {
        set({ wordAudio: enabled })
        syncToServer({ word_audio_enabled: enabled })
      },

      setKeyClicks: (enabled: boolean): void => {
        set({ keyClicks: enabled })
        syncToServer({ key_clicks_enabled: enabled })
      },

      setAutoAdvance: (mode: AutoAdvance): void => {
        set({ autoAdvance: mode })
        syncToServer({ auto_advance: mode })
      },

      hydrateFromProfile: (profile): void => {
        set({
          inputMode: profile.inputMode,
          inputDirection: profile.inputDirection as InputDirection,
          kotobaInput: profile.kotobaInput as KotobaInput,
          hints: profile.hintsEnabled,
          furigana: profile.furiganaEnabled,
          wordAudio: profile.wordAudioEnabled,
          keyClicks: profile.keyClicksEnabled,
          autoAdvance: profile.autoAdvance as AutoAdvance,
        })
      },
    }),
    {
      name: 'langtap-settings',
      storage: createScopedStorage('langtap-settings'),
      partialize: (state) => ({
        inputMode: state.inputMode,
        inputDirection: state.inputDirection,
        kotobaInput: state.kotobaInput,
        hints: state.hints,
        furigana: state.furigana,
        wordAudio: state.wordAudio,
        keyClicks: state.keyClicks,
        autoAdvance: state.autoAdvance,
      }),
    },
  ),
)

registerScopedStore(useSettingsStore, {
  inputMode: 'tap',
  inputDirection: 'alternate',
  kotobaInput: 'readings',
  hints: true,
  furigana: true,
  wordAudio: true,
  keyClicks: false,
  autoAdvance: 'delayed',
})
