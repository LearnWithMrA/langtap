// ─────────────────────────────────────────────
// File: stores/guest-distance.store.ts
// Purpose: Tracks cumulative practice distance for guest users.
//          Persisted to localStorage. Keyed by gameType (kana/kotoba),
//          not input mode. Used for the 15m guest trial cap.
//          Signed-in users never interact with this store.
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

// ── Store ─────────────────────────────────────

export const useGuestDistanceStore = create<GuestDistanceState & GuestDistanceActions>()(
  persist(
    (set, get) => ({
      distances: { kana: 0, kotoba: 0 },

      addDistance: (gameType: GameType, metres: number): void => {
        set((state) => ({
          distances: {
            ...state.distances,
            [gameType]: state.distances[gameType] + metres,
          },
        }))
      },

      getDistance: (gameType: GameType): number => {
        return get().distances[gameType]
      },
    }),
    {
      name: 'langtap-guest-distance',
    },
  ),
)
