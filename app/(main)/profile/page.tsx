// ------------------------------------------------------------
// File: app/(main)/profile/page.tsx
// Purpose: Profile screen route. Renders ProfileClient as a
//          client island. Identity, account management, and
//          membership. No game stats (those live on /home).
// Depends on: components/profile/profile-client.tsx
// ------------------------------------------------------------

import type { ReactNode } from 'react'
import { ProfileClient } from '@/components/profile/profile-client'

export default function ProfilePage(): ReactNode {
  return <ProfileClient />
}
