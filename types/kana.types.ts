// ─────────────────────────────────────────────
// File: types/kana.types.ts
// Purpose: TypeScript type definitions for kana characters, mastery scores,
//          and unlock state. Used across engine, stores, services, and hooks.
// Depends on: nothing
// ─────────────────────────────────────────────

// ── Mastery ───────────────────────────────────

// Non-negative integer. No upper bound. Grows with correct first attempts.
export type MasteryScore = number
