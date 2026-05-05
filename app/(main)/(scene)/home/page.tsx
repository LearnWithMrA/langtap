// ------------------------------------------------------------
// File: app/(main)/home/page.tsx
// Purpose: Game home screen route. Mode selection hub for
//          logged-in users. Guests are redirected to /practice
//          by middleware (Sprint 3). Renders GameHomeClient
//          as a client island.
// Depends on: components/layout/game-home-client.tsx
// ------------------------------------------------------------

import type { ReactNode } from 'react'
import { GameHomeClient } from '@/components/layout/game-home-client'

export default function HomePage(): ReactNode {
  return <GameHomeClient />
}
