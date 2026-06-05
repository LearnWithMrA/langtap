// ─────────────────────────────────────────────
// File: app/(main)/demo/dojo/kotoba/page.tsx
// Purpose: Demo kotoba dojo route. Renders the same KotobaDojoClient
//          with demo=true so it uses fixture data via local state
//          instead of persisted Zustand stores. All interactions work
//          but nothing persists.
// Depends on: components/layout/kotoba-dojo-client.tsx
// ─────────────────────────────────────────────

import type { ReactNode } from 'react'
import { KotobaDojoClient } from '@/components/layout/kotoba-dojo-client'

export default function DemoKotobaDojoPage(): ReactNode {
  return <KotobaDojoClient demo />
}
