// ─────────────────────────────────────────────
// File: components/dojo/kana-dojo-helpers.ts
// Purpose: Utility functions for the Kana Dojo page. Builds the
//          locked character set and groups characters by script/stage.
// Depends on: engine/constants.ts, data/kana/characters.ts,
//             types/mastery.types.ts
// ─────────────────────────────────────────────

import { UNLOCK_THRESHOLD, KANA_WORD_ELIGIBLE_THRESHOLD } from '@/engine/constants'
import { KANA_CHARACTERS } from '@/data/kana/characters'
import { getPracticeAvailableIds } from '@/engine/practice-eligibility'
import { PROGRESSION_GROUPS, UNLOCK_STEPS } from '@/data/kana/progression-groups'
import type { KanaCharacter, Script, Stage } from '@/types/kana.types'
import type { MasteryState } from '@/types/game.types'

const SPECIAL_ROWS = new Set(['sokuon', 'longvowel'])
export const DOJO_CHARACTERS = KANA_CHARACTERS.filter((c) => !SPECIAL_ROWS.has(c.row))

export function buildLockedSet(state: MasteryState): Set<string> {
  const manual = new Set(state.manuallyUnlocked)
  const locked = new Set<string>()
  for (const c of DOJO_CHARACTERS) {
    if (manual.has(c.id)) continue
    if ((state.learningScores[c.id] ?? 0) >= KANA_WORD_ELIGIBLE_THRESHOLD) continue
    locked.add(c.id)
  }
  return locked
}

export type TileState = 'locked' | 'learning' | 'unlocked'

export function buildTileStates(state: MasteryState): Record<string, TileState> {
  const manual = new Set(state.manuallyUnlocked)
  const practiceIds = getPracticeAvailableIds(
    state.learningScores,
    manual,
    PROGRESSION_GROUPS,
    UNLOCK_STEPS,
  )
  const result: Record<string, TileState> = {}
  for (const c of DOJO_CHARACTERS) {
    const learningScore = state.learningScores[c.id] ?? 0
    if (manual.has(c.id) || learningScore >= KANA_WORD_ELIGIBLE_THRESHOLD) {
      result[c.id] = 'unlocked'
    } else if (practiceIds.has(c.id) && learningScore > 0) {
      result[c.id] = 'learning'
    } else {
      result[c.id] = 'locked'
    }
  }
  return result
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
