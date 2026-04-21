// ─────────────────────────────────────────────
// File: types/kotoba.types.ts
// Purpose: TypeScript type definitions for Kotoba (vocabulary) entries,
//          JLPT level structure, unit and level-group hierarchy, and the
//          derived Dojo state that powers /dojo/kotoba.
//          Shape is forward-looking: the Sprint 5 word-bank generator is
//          expected to populate these same types so swapping the fixture
//          source does not ripple into components or tests.
// Depends on: nothing
// ─────────────────────────────────────────────

// ── JLPT levels ───────────────────────────────

// Five JLPT levels. N5 is the easiest, N1 the hardest. Ordering matters for
// the tab row and progression gating.
export type JlptLevel = 'n5' | 'n4' | 'n3' | 'n2' | 'n1'

export const JLPT_ORDER: readonly JlptLevel[] = ['n5', 'n4', 'n3', 'n2', 'n1']

export const JLPT_LABELS: Readonly<Record<JlptLevel, string>> = {
  n5: 'N5',
  n4: 'N4',
  n3: 'N3',
  n2: 'N2',
  n1: 'N1',
}

// ── Mastery ───────────────────────────────────

// Non-negative integer. No upper bound. Grows with correct first attempts.
// Same semantics as MasteryScore in types/kana.types.ts.
export type KotobaMasteryScore = number

// ── Word ──────────────────────────────────────

// A single vocabulary entry. `kanji` is null for kana-only words; the Dojo
// tile reserves the kanji row for layout parity regardless.
// `id` is stable and must never change once assigned.
// `english` is a single gloss string; the word-bank generator (Sprint 5)
// strips to the first clean definition per CONTENT.md §7.3.
export type KotobaWord = {
  id: string
  kanji: string | null
  kana: string
  english: string
  jlpt: JlptLevel
}

// ── Level group (inner accordion row) ─────────

// A level group bundles the words for a contiguous JLPT-level range. In v1
// "Levels 1-2" and "Levels 3-4" are the two canonical groups per unit.
// `wordIds` is ordered (chart order). An empty array means "Coming soon".
export type KotobaLevelGroup = {
  id: string
  label: string
  wordIds: readonly string[]
}

// ── Unit (outer accordion / grid card) ────────

// A unit bundles a handful of level groups. There is no unit-level
// "locked" gate: every unit is expandable and word-level locking drives
// the padlock visuals inside. A unit where every word happens to be
// locked still opens, revealing all-locked tiles that can be unlocked
// individually (tap the tile) or in bulk (unit / group / page lock
// buttons).
export type KotobaUnit = {
  id: string
  label: string
  levelRange: string
  jlpt: JlptLevel
  groups: readonly KotobaLevelGroup[]
}

// ── Aggregate state ───────────────────────────

// Wire-format keeps Set-like data as string[] so the shape can cross the
// Next.js server/client boundary without serialisation warnings. Clients
// convert to Set internally for O(1) membership checks.
// A word is "unlocked" when either its score is >= UNLOCK_THRESHOLD or
// its id is present in `manuallyUnlockedWords`, mirroring the Kana model.
// Unit-level locking is an additional gate on top of word locking (a
// locked unit hides its words entirely; an unlocked unit can still
// contain individually-locked word tiles).
export type KotobaMasteryState = {
  scores: Readonly<Record<string, KotobaMasteryScore>>
  manuallyUnlockedUnits: readonly string[]
  manuallyUnlockedWords: readonly string[]
}

// Explicit trigger for non-happy screens. `'ready'` is the default; the
// other values let tests drive loading / error / empty paths
// deterministically without racing on fetches.
export type KotobaClientState = 'ready' | 'loading' | 'error' | 'empty'

// ── Fixture shape ─────────────────────────────

// Full visual-shell payload. The route file picks a fixture key; the client
// consumes the resolved KotobaDojoFixture. Sprint 5 will replace the fixture
// source with a real store / Supabase fetch using the same payload shape.
export type KotobaDojoFixture = {
  levels: Readonly<Record<JlptLevel, readonly KotobaUnit[]>>
  words: Readonly<Record<string, KotobaWord>>
  mastery: KotobaMasteryState
}

export type KotobaFixtureKey = 'variety' | 'empty' | 'complete'
