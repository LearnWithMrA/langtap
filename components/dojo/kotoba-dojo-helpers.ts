// ─────────────────────────────────────────────
// File: components/dojo/kotoba-dojo-helpers.ts
// Purpose: Utility functions for the Kotoba Dojo page. Builds the
//          locked word set and finds locked IDs at various scopes
//          (unit, group, level).
// Depends on: types/kotoba.types.ts
// ─────────────────────────────────────────────

import type { KotobaLevelGroup, KotobaUnit, KotobaWord } from '@/types/kotoba.types'

export function buildLockedWordSet(
  words: Readonly<Record<string, KotobaWord>>,
  progressionUnlockedIds: ReadonlySet<string>,
  manuallyUnlockedWordIds: ReadonlySet<string>,
): Set<string> {
  const locked = new Set<string>()
  for (const id of Object.keys(words)) {
    if (progressionUnlockedIds.has(id)) continue
    if (manuallyUnlockedWordIds.has(id)) continue
    locked.add(id)
  }
  return locked
}

export function lockedIdsInUnit(unit: KotobaUnit, lockedWordIds: ReadonlySet<string>): string[] {
  return unit.groups.flatMap((g) => g.wordIds.filter((id) => lockedWordIds.has(id)))
}

export function lockedIdsInGroup(
  group: KotobaLevelGroup,
  lockedWordIds: ReadonlySet<string>,
): string[] {
  return group.wordIds.filter((id) => lockedWordIds.has(id))
}

export function lockedIdsAtLevel(
  units: readonly KotobaUnit[],
  lockedWordIds: ReadonlySet<string>,
): string[] {
  return units.flatMap((u) => lockedIdsInUnit(u, lockedWordIds))
}
