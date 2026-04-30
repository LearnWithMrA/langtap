// ─────────────────────────────────────────────
// File: app/(main)/dojo/kotoba/page.tsx
// Purpose: Canonical route for the Kotoba Dojo. Renders
//          KotobaDojoClient which reads word mastery from the
//          Zustand store and level/word data from the word bank.
// Depends on: components/layout/kotoba-dojo-client.tsx
// ─────────────────────────────────────────────

import type { ReactNode } from 'react'
import { KotobaDojoClient } from '@/components/layout/kotoba-dojo-client'

export default function KotobaDojoPage(): ReactNode {
  return <KotobaDojoClient />
}
