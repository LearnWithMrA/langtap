// ─────────────────────────────────────────────
// File: app/(main)/dojo/kotoba/page.tsx
// Purpose: Canonical route for the Kotoba Dojo. Renders
//          KotobaDojoClient with the mid-progress `variety` fixture
//          for the visual shell. Real mastery wiring, Supabase
//          persistence, and URL deep-linking arrive in Sprint 4
//          alongside the Kotoba mastery store.
// Depends on: components/layout/kotoba-dojo-client.tsx
// ─────────────────────────────────────────────

import type { ReactNode } from 'react'
import { KotobaDojoClient } from '@/components/layout/kotoba-dojo-client'

export default function KotobaDojoPage(): ReactNode {
  return <KotobaDojoClient fixture="variety" />
}
