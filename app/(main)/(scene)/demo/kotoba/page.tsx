// ─────────────────────────────────────────────
// File: app/(main)/(scene)/demo/kotoba/page.tsx
// Purpose: Demo kotoba practice route. No auth required, no onboarding
//          redirect. Uses demo session hooks instead of real ones.
// Depends on: components/layout/demo-practice-client.tsx
// ─────────────────────────────────────────────

import type { ReactNode } from 'react'
import { DemoPracticeClient } from '@/components/layout/demo-practice-client'

export default function DemoKotobaPracticePage(): ReactNode {
  return <DemoPracticeClient gameType="kotoba" />
}
