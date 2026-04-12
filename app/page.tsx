// ------------------------------------------------------------
// File: app/page.tsx
// Purpose: Landing page. Public. No auth required. Server component.
//          Renders the LandingClient as a client island for all
//          interactive elements (nav, scene, easter egg, pricing).
// Depends on: components/layout/landing-client.tsx
// ------------------------------------------------------------

import type { ReactNode } from 'react'
import { LandingClient } from '@/components/layout/landing-client'

// -- Page ---------------------------------------------------

export default function LandingPage(): ReactNode {
  return <LandingClient />
}
