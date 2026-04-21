// ─────────────────────────────────────────────
// File: app/(main)/dojo/page.tsx
// Purpose: Bare /dojo is intentionally unhandled. Nothing in the UI
//          links here: Kana and Kotoba each have their own canonical
//          route (/dojo/kana and /dojo/kotoba) reached via the in-app
//          top bar. Typed URLs, stale bookmarks, and external links
//          fall through to the global not-found page. See
//          UX_DESIGN.md §9.2.
// Depends on: next/navigation
// ─────────────────────────────────────────────

import { notFound } from 'next/navigation'

export default function DojoIndex(): never {
  notFound()
}
