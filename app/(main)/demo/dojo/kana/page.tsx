// ─────────────────────────────────────────────
// File: app/(main)/demo/dojo/kana/page.tsx
// Purpose: Demo kana dojo route. Renders the same KanaDojoClient with
//          demo=true so it uses fixture data via local state instead
//          of persisted Zustand stores. All interactions work but
//          nothing persists.
// Depends on: components/layout/kana-dojo-client.tsx
// ─────────────────────────────────────────────

import type { ReactNode } from 'react'
import { KanaDojoClient } from '@/components/layout/kana-dojo-client'

export default function DemoKanaDojoPage(): ReactNode {
  return <KanaDojoClient demo />
}
