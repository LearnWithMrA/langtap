// ------------------------------------------------------------
// File: app/(auth)/sign-up/page.tsx
// Purpose: Full-page sign-up fallback for direct URL navigation
//          (bookmarks, refresh, shared links). The primary flow
//          is the state-driven modal on the landing page.
// Depends on: components/ui/sign-up-card, components/ui/log-in-card
// ------------------------------------------------------------

'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { SignUpCard } from '@/components/ui/sign-up-card'
import { LogInCard } from '@/components/ui/log-in-card'

type Mode = 'sign-up' | 'log-in'

export default function SignUpPage(): ReactNode {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('sign-up')

  const goHome = (): void => {
    router.push('/')
  }

  return mode === 'sign-up' ? (
    <SignUpCard onClose={goHome} onSwitchToLogIn={() => setMode('log-in')} />
  ) : (
    <LogInCard onClose={goHome} onSwitchToSignUp={() => setMode('sign-up')} />
  )
}
