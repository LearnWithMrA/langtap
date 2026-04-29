// ------------------------------------------------------------
// File: types/word.types.ts
// Purpose: TypeScript type definitions for word bank entries and
//          word counter state. Used by engine, stores, and hooks.
//          Phase 1 minimal. Likely additions in Phase 2: romaji,
//          frequency, audioPath.
// Depends on: types/user.types.ts
// ------------------------------------------------------------

import type { JlptLevel } from '@/types/user.types'

// ── Word bank ────────────────────────────────

/**
 * A single entry in the word bank.
 * Word bank entries are static data imported from data/words/.
 * They are not fetched from Supabase.
 *
 * characterIds lists every kana character present in the word.
 * Used by isWordEligible() to check that all characters are
 * unlocked before showing the word.
 */
export type WordBankEntry = {
  id: string
  kana: string
  english: string
  jlptLevel: JlptLevel
  characterIds: string[]
}

// ── Counter ──────────────────────────────────

/**
 * Map of word ID to counter value (0 to MAX_WORD_COUNTER).
 * Counter tracks how many times a word has been shown recently.
 * Higher counter means the word should be deprioritised.
 */
export type WordCounterMap = Record<string, number>
