// ------------------------------------------------------------
// File: app/(auth)/log-in/page.tsx
// Purpose: Full-page log-in fallback for direct URL navigation
//          (bookmarks, refresh, shared links). The primary flow
//          is the state-driven modal on the landing page.
// Depends on: components/ui/log-in-card, components/ui/sign-up-card
// ------------------------------------------------------------

'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { LogInCard } from '@/components/ui/log-in-card'
import { SignUpCard } from '@/components/ui/sign-up-card'

type Mode = 'log-in' | 'sign-up'

export default function LogInPage(): ReactNode {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('log-in')

  const goHome = (): void => {
    router.push('/')
  }

  return mode === 'log-in' ? (
    <LogInCard onClose={goHome} onSwitchToSignUp={() => setMode('sign-up')} />
  ) : (
    <SignUpCard onClose={goHome} onSwitchToLogIn={() => setMode('log-in')} />
  )
}
