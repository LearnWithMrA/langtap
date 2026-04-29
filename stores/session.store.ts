// ------------------------------------------------------------
// File: stores/session.store.ts
// Purpose: Zustand store for current session state.
//          Tracks correct answers, wrong answers, distance, and duration.
//          Resets at the start of every new session.
//          In-memory only (no persist). Session-scoped.
// Depends on: nothing (pure state container)
// ------------------------------------------------------------

import { create } from 'zustand'

// ── Types ────────────────────────────────────

type SessionState = {
  correctAnswers: number
  wrongAnswers: number
  distanceMetres: number
  durationSeconds: number
  charactersEncountered: Set<string>
  isActive: boolean
}

type SessionActions = {
  startSession: () => void
  endSession: () => void
  recordCorrect: (characterId: string, distanceIncrement: number) => void
  recordWrong: (characterId: string) => void
  addDuration: (seconds: number) => void
  reset: () => void
}

// ── Store ────────────────────────────────────

const INITIAL_STATE: SessionState = {
  correctAnswers: 0,
  wrongAnswers: 0,
  distanceMetres: 0,
  durationSeconds: 0,
  charactersEncountered: new Set<string>(),
  isActive: false,
}

export const useSessionStore = create<SessionState & SessionActions>()((set) => ({
  ...INITIAL_STATE,

  startSession: (): void => {
    set({
      correctAnswers: 0,
      wrongAnswers: 0,
      distanceMetres: 0,
      durationSeconds: 0,
      charactersEncountered: new Set<string>(),
      isActive: true,
    })
  },

  endSession: (): void => {
    set({ isActive: false })
  },

  recordCorrect: (characterId: string, distanceIncrement: number): void => {
    set((state) => {
      const next = new Set(state.charactersEncountered)
      next.add(characterId)
      return {
        correctAnswers: state.correctAnswers + 1,
        distanceMetres: state.distanceMetres + distanceIncrement,
        charactersEncountered: next,
      }
    })
  },

  recordWrong: (characterId: string): void => {
    set((state) => {
      const next = new Set(state.charactersEncountered)
      next.add(characterId)
      return {
        wrongAnswers: state.wrongAnswers + 1,
        charactersEncountered: next,
      }
    })
  },

  addDuration: (seconds: number): void => {
    set((state) => ({
      durationSeconds: state.durationSeconds + seconds,
    }))
  },

  reset: (): void => {
    set({
      correctAnswers: 0,
      wrongAnswers: 0,
      distanceMetres: 0,
      durationSeconds: 0,
      charactersEncountered: new Set<string>(),
      isActive: false,
    })
  },
}))
