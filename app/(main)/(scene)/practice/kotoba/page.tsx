// ------------------------------------------------------------
// File: app/(main)/practice/kotoba/page.tsx
// Purpose: Kotoba practice route. Passes gameType="kotoba" to
//          PracticeClient so kotoba code lazy-loads on demand.
// Depends on: components/layout/practice-client.tsx
// ------------------------------------------------------------

import type { ReactNode } from 'react'
import { PracticeClient } from '@/components/layout/practice-client'

export default function KotobaPracticePage(): ReactNode {
  return <PracticeClient gameType="kotoba" />
}
