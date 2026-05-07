// ─────────────────────────────────────────────
// File: components/profile/profile-helpers.ts
// Purpose: Date formatting and username cooldown helpers for the
//          Profile screen. Pure functions, no side effects.
//          Accepts both date-only (YYYY-MM-DD) and full ISO
//          timestamps (2026-04-01T00:00:00Z) from Supabase.
// Depends on: none
// ─────────────────────────────────────────────

// ── Constants ─────────────────────────────────

const USERNAME_COOLDOWN_DAYS = 30
const MS_PER_DAY = 1000 * 60 * 60 * 24

// ── Helpers ───────────────────────────────────

function parseDate(dateStr: string): Date {
  return new Date(dateStr)
}

export function formatMemberSince(dateStr: string): string {
  const d = parseDate(dateStr)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export function daysUntilNextChange(changedAt: string): number {
  const changed = parseDate(changedAt)
  if (isNaN(changed.getTime())) return 0
  const nextAllowed = new Date(changed)
  nextAllowed.setDate(nextAllowed.getDate() + USERNAME_COOLDOWN_DAYS)
  const now = new Date()
  const diff = Math.ceil((nextAllowed.getTime() - now.getTime()) / MS_PER_DAY)
  return Math.max(0, diff)
}

export function formatNextChangeDate(changedAt: string): string {
  const changed = parseDate(changedAt)
  if (isNaN(changed.getTime())) return ''
  const nextAllowed = new Date(changed)
  nextAllowed.setDate(nextAllowed.getDate() + USERNAME_COOLDOWN_DAYS)
  return nextAllowed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
