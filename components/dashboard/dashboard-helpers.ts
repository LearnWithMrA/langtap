// ─────────────────────────────────────────────
// File: components/dashboard/dashboard-helpers.ts
// Purpose: Formatting functions and heat-class helpers for the
//          game home dashboard. Pure functions, no side effects.
// Depends on: (none)
// ─────────────────────────────────────────────

// ── Formatters ────────────────────────────────

/** Formats an ISO timestamp into a human-readable recency label. */
export function formatLastPracticed(iso: string | null): string {
  if (!iso) return 'Never'
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'Yesterday'
  return `${days}d ago`
}

/** Formats a distance in metres into a compact string (m or km). */
export function formatDistance(metres: number): string {
  if (metres === 0) return '0 m'
  if (metres < 1000) return `${metres} m`
  return `${(metres / 1000).toFixed(1)} km`
}

/** Formats a score number with a compact suffix for large values. */
export function formatScore(n: number): string {
  if (n >= 10000) return `${(n / 1000).toFixed(1)}k`
  return n.toLocaleString()
}

// ── Heat-class helpers ────────────────────────

/** Returns a Tailwind background class based on characters practiced count. */
export function getHeatClass(chars: number): string {
  if (chars === 0) return 'bg-warm-100'
  if (chars <= 10) return 'bg-heat-1'
  if (chars <= 30) return 'bg-heat-2'
  if (chars <= 60) return 'bg-heat-3'
  if (chars <= 100) return 'bg-heat-4'
  return 'bg-heat-5'
}

/** Returns a Tailwind background class based on mastery percentage. */
export function getProgressHeatClass(percentage: number): string {
  if (percentage === 0) return 'bg-warm-200'
  if (percentage <= 20) return 'bg-heat-1'
  if (percentage <= 40) return 'bg-heat-2'
  if (percentage <= 60) return 'bg-heat-3'
  if (percentage <= 80) return 'bg-heat-4'
  return 'bg-heat-5'
}
