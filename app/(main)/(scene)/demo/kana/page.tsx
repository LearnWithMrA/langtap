// ─────────────────────────────────────────────
// File: app/(main)/(scene)/demo/kana/page.tsx
// Purpose: Demo kana practice route. No auth required, no onboarding
//          redirect. Uses demo session hooks instead of real ones.
// Depends on: components/layout/demo-practice-client.tsx
// ─────────────────────────────────────────────

import type { ReactNode } from 'react'
import { DemoPracticeClient } from '@/components/layout/demo-practice-client'

export default function DemoKanaPracticePage(): ReactNode {
  return <DemoPracticeClient gameType="kana" />
}
