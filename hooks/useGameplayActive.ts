// ─────────────────────────────────────────────
// File: hooks/useGameplayActive.ts
// Purpose: Returns true when gameplay is active. Reads from the
//          gameplay store (set by ActivePracticeClient when a prompt
//          is visible). Used by prefetch and preloader to avoid
//          network activity during play.
// Depends on: stores/gameplay.store.ts
// ─────────────────────────────────────────────

import { useGameplayStore } from '@/stores/gameplay.store'

export function useGameplayActive(): boolean {
  return useGameplayStore((s) => s.isActive)
}
