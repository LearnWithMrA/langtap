// ─────────────────────────────────────────────
// File: components/dojo/kana-dojo-helpers.ts
// Purpose: Utility functions for the Kana Dojo page. Builds the
//          locked character set and groups characters by script/stage.
// Depends on: engine/constants.ts, data/kana/characters.ts,
//             types/mastery.types.ts
// ─────────────────────────────────────────────

import { UNLOCK_THRESHOLD } from '@/engine/constants'
import { KANA_CHARACTERS } from '@/data/kana/characters'
import type { KanaCharacter, Script, Stage } from '@/types/kana.types'
import type { MasteryState } from '@/types/game.types'

const SPECIAL_ROWS = new Set(['sokuon', 'longvowel'])
export const DOJO_CHARACTERS = KANA_CHARACTERS.filter((c) => !SPECIAL_ROWS.has(c.row))

export function buildLockedSet(state: MasteryState): Set<string> {
  const manual = new Set(state.manuallyUnlocked)
  const locked = new Set<string>()
  for (const c of DOJO_CHARACTERS) {
    if (manual.has(c.id)) continue
    if ((state.scores[c.id] ?? 0) >= UNLOCK_THRESHOLD) continue
    locked.add(c.id)
  }
  return locked
}

export function hasLockedCharacter(
  characters: readonly KanaCharacter[],
  lockedIds: ReadonlySet<string>,
): boolean {
  return characters.some((c) => lockedIds.has(c.id))
}

export function hasAnyUnlock(
  characters: readonly KanaCharacter[],
  scores: Readonly<Record<string, number>>,
  manualUnlocks: ReadonlySet<string>,
): boolean {
  return characters.some((c) => manualUnlocks.has(c.id) || (scores[c.id] ?? 0) >= UNLOCK_THRESHOLD)
}

export function groupCharactersByStage(): Readonly<
  Record<Script, Readonly<Record<Stage, readonly KanaCharacter[]>>>
> {
  const out: Record<Script, Record<Stage, KanaCharacter[]>> = {
    hiragana: { seion: [], dakuon: [], combination: [] },
    katakana: { seion: [], dakuon: [], combination: [] },
  }
  for (const c of DOJO_CHARACTERS) {
    out[c.script][c.stage].push(c)
  }
  return out
}

export const CHARACTERS_BY_SCRIPT_STAGE = groupCharactersByStage()

export function scriptCharacters(script: Script): readonly KanaCharacter[] {
  return DOJO_CHARACTERS.filter((c) => c.script === script)
}

export function lockedInScope(
  characters: readonly KanaCharacter[],
  lockedIds: ReadonlySet<string>,
): string[] {
  return characters.filter((c) => lockedIds.has(c.id)).map((c) => c.id)
}
