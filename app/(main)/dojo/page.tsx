// ─────────────────────────────────────────────
// File: app/(main)/dojo/page.tsx
// Purpose: Permanent (308) redirect from the legacy /dojo path to the
//          canonical /dojo/kana route. The Kana Dojo and Kotoba Dojo
//          are separate pages with their own top-bar links; there is
//          no hub at /dojo. This redirect protects bookmarks and any
//          external links still pointing at the old path.
// Depends on: next/navigation
// ─────────────────────────────────────────────

import { permanentRedirect } from 'next/navigation'

export default function DojoIndex(): never {
  permanentRedirect('/dojo/kana')
}
