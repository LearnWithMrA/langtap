// ─────────────────────────────────────────────
// File: stores/auth-modal.store.ts
// Purpose: Controls auth modal visibility from any component.
//          Not persisted. Resets on page refresh.
// Depends on: zustand
// ─────────────────────────────────────────────

import { create } from 'zustand'

// ── Types ─────────────────────────────────────

type AuthModalView = 'log-in' | 'sign-up' | null

type AuthModalState = {
  view: AuthModalView
  openLogIn: () => void
  openSignUp: () => void
  close: () => void
}

// ── Store ─────────────────────────────────────

export const useAuthModalStore = create<AuthModalState>()((set) => ({
  view: null,
  openLogIn: (): void => set({ view: 'log-in' }),
  openSignUp: (): void => set({ view: 'sign-up' }),
  close: (): void => set({ view: null }),
}))
