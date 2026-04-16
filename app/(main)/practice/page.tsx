// ------------------------------------------------------------
// File: app/(main)/practice/page.tsx
// Purpose: Core practice screen route. Guest or authenticated.
//          Renders PracticeClient as a client island with all
//          three input modes (Type, Tap, Swipe).
// Depends on: components/layout/practice-client.tsx
// ------------------------------------------------------------

import type { ReactNode } from 'react'
import { PracticeClient } from '@/components/layout/practice-client'

export default function PracticePage(): ReactNode {
  return <PracticeClient />
}
