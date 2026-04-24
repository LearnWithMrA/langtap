// ─────────────────────────────────────────────
// File: types/settings.types.ts
// Purpose: TypeScript type definitions for game settings.
//          Input direction, auto-advance mode.
// Depends on: nothing
// ─────────────────────────────────────────────

// ── Input Direction ──────────────────────────

/** Practice direction: what the user sees vs what they type. */
export type InputDirection = 'kana-to-romaji' | 'alternate' | 'romaji-to-kana'

// ── Auto-Advance ─────────────────────────────

/** How the app advances after a correct answer. */
export type AutoAdvance = 'instant' | 'delayed'
