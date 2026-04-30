// ─────────────────────────────────────────────
// File: components/layout/auth-modal-provider.tsx
// Purpose: Renders the auth modal overlay in the (main) layout.
//          Driven by auth-modal.store so any component can trigger it.
// Depends on: stores/auth-modal.store.ts,
//             components/ui/auth-modal.tsx,
//             components/ui/log-in-card.tsx,
//             components/ui/sign-up-card.tsx
// ─────────────────────────────────────────────

'use client'

import type { ReactNode } from 'react'
import { useAuthModalStore } from '@/stores/auth-modal.store'
import { AuthModal } from '@/components/ui/auth-modal'
import { LogInCard } from '@/components/ui/log-in-card'
import { SignUpCard } from '@/components/ui/sign-up-card'

// ── Component ─────────────────────────────────

export function AuthModalProvider(): ReactNode {
  const view = useAuthModalStore((s) => s.view)
  const openLogIn = useAuthModalStore((s) => s.openLogIn)
  const openSignUp = useAuthModalStore((s) => s.openSignUp)
  const close = useAuthModalStore((s) => s.close)

  if (view === null) return null

  return (
    <AuthModal onClose={close}>
      {view === 'log-in' ? (
        <LogInCard onClose={close} onSwitchToSignUp={openSignUp} />
      ) : (
        <SignUpCard onClose={close} onSwitchToLogIn={openLogIn} />
      )}
    </AuthModal>
  )
}
