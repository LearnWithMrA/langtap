// ------------------------------------------------------------
// File: app/(main)/practice/kana/page.tsx
// Purpose: Kana practice route. Passes gameType="kana" to
//          PracticeClient so only kana-related code loads.
// Depends on: components/layout/practice-client.tsx
// ------------------------------------------------------------

import type { ReactNode } from 'react'
import { PracticeClient } from '@/components/layout/practice-client'

export default function KanaPracticePage(): ReactNode {
  return <PracticeClient gameType="kana" />
}
