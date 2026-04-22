// ------------------------------------------------------------
// File: stores/onboarding.store.ts
// Purpose: Zustand store for onboarding flow state. Persisted to
//          localStorage (key: langtap-onboarding) via persist
//          middleware. Sprint 3 migrates to Supabase on sign-up.
//          Uses skipHydration to prevent flash of default state.
// Depends on: zustand, zustand/middleware
// ------------------------------------------------------------

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// -- Types -------------------------------------------------------

export type JlptLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1'
export type InputMode = 'type' | 'tap' | 'swipe'

export type OnboardingStore = OnboardingState & OnboardingActions

type OnboardingState = {
  jlptLevel: JlptLevel
  selectedCharacterIds: string[]
  inputMode: InputMode
  onboardingComplete: boolean
}

type OnboardingActions = {
  setJlptLevel: (level: JlptLevel) => void
  toggleCharacter: (id: string) => void
  setSelectedBulk: (ids: string[]) => void
  toggleGroup: (groupIds: string[]) => void
  removeGroup: (groupIds: string[]) => void
  clearCharacters: () => void
  setInputMode: (mode: InputMode) => void
  completeOnboarding: () => void
}

// -- Store -------------------------------------------------------

export const useOnboardingStore = create<OnboardingState & OnboardingActions>()(
  persist(
    (set) => ({
      jlptLevel: 'N5',
      selectedCharacterIds: [],
      inputMode: 'type',
      onboardingComplete: false,

      setJlptLevel: (level: JlptLevel): void => {
        set({ jlptLevel: level })
      },

      toggleCharacter: (id: string): void => {
        set((state) => {
          const ids = state.selectedCharacterIds
          const next = ids.includes(id) ? ids.filter((c) => c !== id) : [...ids, id]
          return { selectedCharacterIds: next }
        })
      },

      setSelectedBulk: (ids: string[]): void => {
        set({ selectedCharacterIds: ids })
      },

      toggleGroup: (groupIds: string[]): void => {
        set((state) => {
          const current = new Set(state.selectedCharacterIds)
          const allSelected = groupIds.every((id) => current.has(id))
          if (allSelected) {
            groupIds.forEach((id) => current.delete(id))
          } else {
            groupIds.forEach((id) => current.add(id))
          }
          return { selectedCharacterIds: Array.from(current) }
        })
      },

      removeGroup: (groupIds: string[]): void => {
        set((state) => {
          const toRemove = new Set(groupIds)
          return {
            selectedCharacterIds: state.selectedCharacterIds.filter((id) => !toRemove.has(id)),
          }
        })
      },

      clearCharacters: (): void => {
        set({ selectedCharacterIds: [] })
      },

      setInputMode: (mode: InputMode): void => {
        set({ inputMode: mode })
      },

      completeOnboarding: (): void => {
        set({ onboardingComplete: true })
      },
    }),
    {
      name: 'langtap-onboarding',
      skipHydration: true,
    },
  ),
)
