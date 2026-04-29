// ─────────────────────────────────────────────
// File: app/(main)/dojo/kana/page.tsx
// Purpose: Canonical route for the Kana Dojo. Renders KanaDojoClient
//          wired to the real mastery and onboarding Zustand stores.
// Depends on: components/layout/kana-dojo-client.tsx
// ─────────────────────────────────────────────

import type { ReactNode } from 'react'
import { KanaDojoClient } from '@/components/layout/kana-dojo-client'

export default function KanaDojoPage(): ReactNode {
  return <KanaDojoClient />
}
