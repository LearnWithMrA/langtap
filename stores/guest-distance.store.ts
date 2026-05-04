// ─────────────────────────────────────────────
// File: stores/guest-distance.store.ts
// Purpose: Tracks cumulative practice distance for guest users.
//          Persisted to localStorage. Keyed by gameType (kana/kotoba),
//          not input mode. Used for the 30m combined guest trial cap.
//          Signed-in users never interact with this store.
//          Note: localStorage limits are UX/conversion nudges, not
//          security controls. A guest can edit localStorage in DevTools.
//          Real anti-abuse requires server-side tracking.
// Depends on: nothing
// ─────────────────────────────────────────────

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ── Types ─────────────────────────────────────

type GameType = 'kana' | 'kotoba'

type GuestDistanceState = {
  distances: Record<GameType, number>
}

type GuestDistanceActions = {
  addDistance: (gameType: GameType, metres: number) => void
  getDistance: (gameType: GameType) => number
}

// ── Helpers ───────────────────────────────────

function sanitizeDistance(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return 0
  return Math.floor(value)
}

// ── Store ─────────────────────────────────────

export const useGuestDistanceStore = create<GuestDistanceState & GuestDistanceActions>()(
  persist(
    (set, get) => ({
      distances: { kana: 0, kotoba: 0 },

      addDistance: (gameType: GameType, metres: number): void => {
        set((state) => ({
          distances: {
            ...state.distances,
            [gameType]: sanitizeDistance(state.distances[gameType]) + sanitizeDistance(metres),
          },
        }))
      },

      getDistance: (gameType: GameType): number => {
        return sanitizeDistance(get().distances[gameType])
      },
    }),
    {
      name: 'langtap-guest-distance',
      merge: (persisted, current) => {
        const stored = persisted as Partial<GuestDistanceState> | null
        return {
          ...current,
          distances: {
            kana: sanitizeDistance(stored?.distances?.kana),
            kotoba: sanitizeDistance(stored?.distances?.kotoba),
          },
        }
      },
    },
  ),
)
