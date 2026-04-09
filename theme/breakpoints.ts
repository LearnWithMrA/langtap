// ------------------------------------------------------------
// File: theme/breakpoints.ts
// Purpose: Documents the responsive breakpoints used across all layouts.
//          LangTap is mobile-first. Base styles target 360px.
//          xs is a custom breakpoint defined in app/globals.css @theme.
//          md and lg are Tailwind defaults (no override needed).
// Depends on: nothing
// ------------------------------------------------------------

// -- Breakpoints -------------------------------------------------
// Design baseline: 360px wide, 667px tall (smallest common smartphone).
// Swipe mode compact target: 360px wide, 300px tall (keyboard open).

export const BREAKPOINTS = {
  base: 360, // px - smallest phone, base styles, no prefix
  xs: 480, // px - large phones, minor spacing increases (custom: --breakpoint-xs)
  md: 768, // px - tablets, wider tap grid, more padding (Tailwind default)
  lg: 1024, // px - desktop, max-width container centred (Tailwind default)
} as const

// -- Swipe mode compact layout -----------------------------------
// When Swipe mode is active the native keyboard consumes the bottom half
// of the screen. The content area target is 360x300px.
// This is the tightest constraint in the app - design Swipe mode here first.

export const SWIPE_CONTENT_HEIGHT_PX = 300
