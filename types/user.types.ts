// ─────────────────────────────────────────────
// File: types/user.types.ts
// Purpose: TypeScript type definitions for user profile, JLPT level,
//          and input mode. Used across services, stores, and hooks.
// Depends on: nothing
// ─────────────────────────────────────────────

// ── JLPT Level ────────────────────────────────

/** The five JLPT vocabulary levels. N5 is beginner, N1 is advanced. */
export type JlptLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1'

// ── Input Mode ────────────────────────────────

/** The three practice input modes. */
export type InputMode = 'tap' | 'type' | 'swipe'
