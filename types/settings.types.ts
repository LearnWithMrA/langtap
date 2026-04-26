// ─────────────────────────────────────────────
// File: types/settings.types.ts
// Purpose: TypeScript type definitions for game settings.
//          Input direction, auto-advance mode.
// Depends on: nothing
// ─────────────────────────────────────────────

// ── Input Mode ──────────────────────────────

/** How the user enters their answer. */
export type InputMode = 'tap' | 'type' | 'swipe'

// ── Input Direction ──────────────────────────

/** Practice direction: what the user sees vs what they type. */
export type InputDirection = 'kana-to-romaji' | 'alternate' | 'romaji-to-kana'

// ── Kotoba Input ─────────────────────────────

/** What the user produces in Kotoba practice. */
export type KotobaInput = 'readings' | 'kanji'

// ── Auto-Advance ─────────────────────────────

/** How the app advances after a correct answer. */
export type AutoAdvance = 'instant' | 'delayed'
