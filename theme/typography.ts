// ------------------------------------------------------------
// File: theme/typography.ts
// Purpose: Documents the LangTap type scale as named constants.
//          The source of truth for font sizes, weights, and line heights.
//          Token values mirror the @theme definitions in app/globals.css.
//          Import these constants when referencing sizes in logic (e.g.
//          mastery-linked font sizing in engine/mastery.ts).
// Depends on: nothing
// ------------------------------------------------------------

// -- Font family -------------------------------------------------

export const FONT_FAMILY = 'Zen Maru Gothic'

// -- Font size scale (rem) ---------------------------------------

export const FONT_SIZE = {
  xs: '0.75rem', // 12px - mnemonic text, captions
  sm: '0.875rem', // 14px - secondary labels, metadata
  base: '1rem', // 16px - body text, UI copy
  lg: '1.125rem', // 18px - slightly prominent labels
  xl: '1.25rem', // 20px - card headings
  '2xl': '1.5rem', // 24px - section headings
  '3xl': '1.875rem', // 30px - practice word display
  '4xl': '2.25rem', // 36px - main character prompt
  '5xl': '3rem', // 48px - large character prompt (early unlock screen)
} as const

// -- Font weights ------------------------------------------------

export const FONT_WEIGHT = {
  light: 300,
  regular: 400,
  medium: 500,
  bold: 700,
  black: 900,
} as const

// -- Line heights ------------------------------------------------

export const LINE_HEIGHT = {
  tight: 1.2, // Display headings, large character prompts
  snug: 1.4, // Card headings, labels
  normal: 1.6, // Body text (default)
  relaxed: 1.8, // Long-form text, mnemonic descriptions
} as const

// -- Mastery-linked font sizing ----------------------------------
// Starting size for a character with score 0: 36px (4xl).
// Decreases by 2px per correct first-attempt answer.
// Minimum size: 14px (sm). See engine/mastery.ts for the calculation.

export const MASTERY_FONT_START_PX = 36
export const MASTERY_FONT_STEP_PX = 2
export const MASTERY_FONT_MIN_PX = 14
