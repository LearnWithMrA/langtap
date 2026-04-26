// ─────────────────────────────────────────────
// File: components/dojo/kotoba-dojo-helpers.ts
// Purpose: Utility functions for the Kotoba Dojo page. Builds the
//          locked word set and finds locked IDs at various scopes
//          (unit, group, level).
// Depends on: engine/constants.ts, types/kotoba.types.ts
// ─────────────────────────────────────────────

import { UNLOCK_THRESHOLD } from '@/engine/constants'
import type {
  KotobaLevelGroup,
  KotobaMasteryState,
  KotobaUnit,
  KotobaWord,
} from '@/types/kotoba.types'

export function buildLockedWordSet(
  words: Readonly<Record<string, KotobaWord>>,
  mastery: KotobaMasteryState,
): Set<string> {
  const manual = new Set(mastery.manuallyUnlockedWords)
  const locked = new Set<string>()
  for (const id of Object.keys(words)) {
    if (manual.has(id)) continue
    if ((mastery.scores[id] ?? 0) >= UNLOCK_THRESHOLD) continue
    locked.add(id)
  }
  return locked
}

export function lockedIdsInUnit(unit: KotobaUnit, lockedWordIds: ReadonlySet<string>): string[] {
  return unit.groups.flatMap((g) => g.wordIds.filter((id) => lockedWordIds.has(id)))
}

export function lockedIdsInGroup(group: KotobaLevelGroup, lockedWordIds: ReadonlySet<string>): string[] {
  return group.wordIds.filter((id) => lockedWordIds.has(id))
}

export function lockedIdsAtLevel(
  units: readonly KotobaUnit[],
  lockedWordIds: ReadonlySet<string>,
): string[] {
  return units.flatMap((u) => lockedIdsInUnit(u, lockedWordIds))
}
