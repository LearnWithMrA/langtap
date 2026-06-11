// ─────────────────────────────────────────────
// File: services/analytics.service.ts
// Purpose: Thin wrapper around Vercel Analytics custom events.
//          All event names live here as constants so the monthly event
//          budget (2,500 events on the free tier) stays auditable in
//          one place. Components and hooks call trackEvent; stores must
//          never import this file (stores do not import services).
// Depends on: @vercel/analytics
// ─────────────────────────────────────────────

import { track } from '@vercel/analytics'

// ── Event names ───────────────────────────────

// Keep this list short: the Vercel free tier allows 2,500 events/month.
export const ANALYTICS_EVENTS = {
  SIGN_UP: 'sign_up',
  FIRST_PRACTICE: 'first_practice',
  TRIAL_COMPLETE: 'trial_complete',
  DAILY_CAP_HIT: 'daily_cap_hit',
} as const

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS]

// ── Main exports ──────────────────────────────

// Fire-and-forget custom event. Never throws: analytics must never break
// a user-facing flow, so failures are swallowed silently.
export function trackEvent(
  name: AnalyticsEventName,
  properties?: Record<string, string | number>,
): void {
  try {
    track(name, properties)
  } catch {
    // Analytics is best-effort; never surface errors to the caller.
  }
}
