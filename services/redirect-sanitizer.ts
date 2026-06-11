// ─────────────────────────────────────────────
// File: services/redirect-sanitizer.ts
// Purpose: Sanitize user-supplied redirect targets (the ?next= param on
//          the auth callback) so they can never leave the app's origin.
//          Pure function, extracted from app/auth/callback/route.ts so it
//          can be unit tested (Next route files only export HTTP methods).
// Depends on: nothing
// ─────────────────────────────────────────────

// ── Main exports ──────────────────────────────

// Returns a safe in-app path. Anything that is not a plain same-origin
// path (protocol-relative URLs, backslashes, encoded slashes, control
// characters, full URLs) falls back to /home.
export function sanitizeNext(raw: string | null): string {
  const fallback = '/home'
  if (!raw) return fallback
  // Reject backslashes (browsers treat \ as / in URLs) and any encoded
  // characters that could smuggle a second slash or scheme past the
  // startsWith checks once decoded by a redirect hop.
  if (raw.includes('\\') || /%2f|%5c|%2e|%09|%0a|%0d/i.test(raw)) return fallback
  if (!raw.startsWith('/') || raw.startsWith('//')) return fallback
  // Reject dot-dot segments entirely; in-app redirect targets never need them.
  if (raw.includes('..')) return fallback
  // Final guard: the resolved URL must stay on a fixed safe origin.
  try {
    const resolved = new URL(raw, 'https://langtap.local')
    if (resolved.origin !== 'https://langtap.local') return fallback
    return raw
  } catch {
    return fallback
  }
}
