// ─────────────────────────────────────────────
// File: app/(main)/dojo/kana/page.tsx
// Purpose: Canonical route for the Kana Dojo. Renders KanaDojoClient
//          with the mid-progress mock fixture for the visual shell.
//          Real mastery/unlock wiring and fixture selection arrive in
//          Sprint 4 alongside the Zustand mastery store and Supabase
//          persistence.
// Depends on: components/layout/kana-dojo-client.tsx
// ─────────────────────────────────────────────

import type { ReactNode } from 'react'
import { KanaDojoClient } from '@/components/layout/kana-dojo-client'

export default function KanaDojoPage(): ReactNode {
  return <KanaDojoClient fixture="variety" />
}
