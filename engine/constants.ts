// ------------------------------------------------------------
// File: engine/constants.ts
// Purpose: All named constants for game timing, thresholds, and
//          scoring. Single source of truth. No magic numbers
//          anywhere else in the codebase.
// Depends on: nothing
// ------------------------------------------------------------

// -- Feedback timing ----------------------------------------

/** Duration of correct/wrong flash on input or tap button (ms) */
export const FEEDBACK_FLASH_MS = 300

/** Delay before romaji hint appears after a wrong answer (ms) */
export const WRONG_ANSWER_DELAY_MS = 800

/** Duration the English meaning stays visible after correct answer (ms) */
export const MEANING_DISPLAY_MS = 1500

/** Duration the result stays visible after correct answer in Kotoba mode (ms) */
export const KOTOBA_DISPLAY_MS = 3000

/** Fade-in duration for meaning reveal (ms) */
export const MEANING_FADE_MS = 150

// -- Tap mode -----------------------------------------------

/** Number of correct answers before the tap reminder tooltip hides */
export const TAP_REMINDER_THRESHOLD = 5

// -- Mastery ------------------------------------------------

/** Mastery score required to unlock a character */
export const UNLOCK_THRESHOLD = 5

/** Maximum value of the per-word counter before reset */
export const MAX_WORD_COUNTER = 5
