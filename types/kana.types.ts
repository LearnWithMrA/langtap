// ─────────────────────────────────────────────
// File: types/kana.types.ts
// Purpose: TypeScript type definitions for kana characters, mastery scores,
//          progression groups, and derived Dojo state. Used across engine,
//          stores, services, hooks, and the Dojo UI.
// Depends on: nothing
// ─────────────────────────────────────────────

// ── Mastery ───────────────────────────────────

// Non-negative integer. No upper bound. Grows with correct first attempts.
export type MasteryScore = number

// ── Kana chart ────────────────────────────────

// Script: 'hiragana' for くだもの-style, 'katakana' for カタカナ.
export type Script = 'hiragana' | 'katakana'

// Progression stages. Matches GAME_DESIGN.md §4.3.
export type Stage = 'seion' | 'dakuon' | 'yoon'

// A single character in the kana chart.
// `id` is stable and must never change once assigned. Components, fixtures,
// and persisted state all reference characters by id.
// `romaji` is Hepburn (shi, chi, tsu, fu, sha, ja, cha, etc.) for display.
// When Hepburn collides (じ/ぢ both "ji", ず/づ both "zu") the `id` uses a
// Kunrei-style suffix (h-ji vs h-di, h-zu vs h-du) so ids stay unique.
// `row` is the gojuon row key (e.g. 'a', 'ka', 'sa', 'pya').
// `column` is the vowel: 'a' | 'i' | 'u' | 'e' | 'o' for seion/dakuon,
// or 'a' | 'u' | 'o' for yoon (representing the ya/yu/yo endings).
export type KanaCharacter = {
  id: string
  kana: string
  romaji: string
  script: Script
  stage: Stage
  row: string
  column: string
}

// ── Progression ───────────────────────────────

// One unlock group in the guided progression (§4.3). Groups are interleaved
// hiragana/katakana within each stage. `groupIndex` is 1-based and resets per
// (stage, script) pair. `characterIds` lists the members in chart order.
export type ProgressionGroup = {
  stage: Stage
  script: Script
  groupIndex: number
  characterIds: readonly string[]
}
