// ─────────────────────────────────────────────
// File: components/profile/profile-helpers.ts
// Purpose: Date formatting and username cooldown helpers for the
//          Profile screen. Pure functions, no side effects.
// Depends on: none
// ─────────────────────────────────────────────

// ── Constants ─────────────────────────────────

const USERNAME_COOLDOWN_DAYS = 30
const MS_PER_DAY = 1000 * 60 * 60 * 24

// ── Helpers ───────────────────────────────────

/** Format an ISO date string (YYYY-MM-DD) as "Month Year". */
export function formatMemberSince(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

/** Return the number of days remaining before a username can be changed again. */
export function daysUntilNextChange(changedAt: string): number {
  const changed = new Date(changedAt + 'T00:00:00')
  const nextAllowed = new Date(changed)
  nextAllowed.setDate(nextAllowed.getDate() + USERNAME_COOLDOWN_DAYS)
  const now = new Date()
  const diff = Math.ceil((nextAllowed.getTime() - now.getTime()) / MS_PER_DAY)
  return Math.max(0, diff)
}

/** Format the next allowed username-change date as "Mon DD, YYYY". */
export function formatNextChangeDate(changedAt: string): string {
  const changed = new Date(changedAt + 'T00:00:00')
  const nextAllowed = new Date(changed)
  nextAllowed.setDate(nextAllowed.getDate() + USERNAME_COOLDOWN_DAYS)
  return nextAllowed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
