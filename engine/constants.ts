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

/** Mastery score required to unlock a kana character */
export const UNLOCK_THRESHOLD = 5

/** Mastery score required to unlock next Kotoba word step */
export const KOTOBA_UNLOCK_THRESHOLD = 3

/** Mastery score for a word to be considered fully mastered */
export const KOTOBA_MASTERY_THRESHOLD = 15

/** Maximum value of the per-word counter before reset */
export const MAX_WORD_COUNTER = 5

/** Scoring multiplier for Kanji input mode in Kotoba practice */
export const KANJI_INPUT_MULTIPLIER = 4

// -- Distance -----------------------------------------

/** Maximum response time in ms before speed bonus drops to zero */
export const MAX_RESPONSE_TIME_MS = 5000

/** Base distance increment per correct answer in metres */
export const BASE_DISTANCE_INCREMENT = 10

/** Conversion factor from metres to feet */
export const METRES_TO_FEET = 3.28084

// -- Streak -------------------------------------------

/** Number of consecutive practice days required before a streak starts */
export const STREAK_START_THRESHOLD = 3
