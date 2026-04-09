// ------------------------------------------------------------
// File: theme/spacing.ts
// Purpose: Documents the spacing values used across all components
//          and layouts. LangTap uses Tailwind's default spacing scale.
//          This file records the key values in active use and the
//          touch target minimum required by Apple HIG.
// Depends on: nothing
// ------------------------------------------------------------

// -- Touch targets -----------------------------------------------
// All interactive elements must meet this minimum tap area (Apple HIG).
// Tailwind: min-h-11 min-w-11

export const TOUCH_TARGET_MIN_PX = 44

// -- Page-level spacing ------------------------------------------
// Standard padding applied by PageShell to the content area.
// Tailwind: p-4 (mobile), p-6 (md+)

export const PAGE_PADDING_MOBILE = '1rem' // 16px
export const PAGE_PADDING_DESKTOP = '1.5rem' // 24px

// -- Component spacing reference ---------------------------------
// These are not custom tokens - they are Tailwind defaults documented here
// so the team has a single reference for which values are in active use.

export const SPACING = {
  2: '0.5rem', // 8px  - tight internal padding, icon gaps
  3: '0.75rem', // 12px - standard small padding
  4: '1rem', // 16px - standard padding (most common)
  6: '1.5rem', // 24px - card and section padding
  8: '2rem', // 32px - page-level padding (desktop)
  11: '2.75rem', // 44px - touch target minimum
  14: '3.5rem', // 56px - TopBar height (h-14)
  16: '4rem', // 64px - BottomNav height (h-16)
} as const

// -- Max content widths ------------------------------------------
// Practice screen and Dojo stay narrow to feel app-like on desktop.
// Leaderboard and profile get more room for tabular content.

export const MAX_WIDTH_NARROW = '28rem' // 448px - max-w-md
export const MAX_WIDTH_WIDE = '42rem' // 672px - max-w-2xl
