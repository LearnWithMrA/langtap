// ------------------------------------------------------------
// File: components/ui/auth-modal.tsx
// Purpose: Overlay shell for auth cards. State-driven, no route
//          navigation. Clicking backdrop or pressing Escape calls
//          onClose. Rendered inline on the landing page.
// Depends on: nothing
// ------------------------------------------------------------

'use client'

import { useCallback, useEffect } from 'react'
import type { ReactNode } from 'react'

// -- Types --------------------------------------------------

type AuthModalProps = {
  children: ReactNode
  onClose: () => void
}

// -- Component ----------------------------------------------

export function AuthModal({ children, onClose }: AuthModalProps): ReactNode {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    },
    [onClose],
  )

  useEffect((): (() => void) => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-[fadeIn_200ms_ease-out]"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-blue-900/55 backdrop-blur-sm" aria-hidden="true" />

      <div
        className="relative z-10 w-full max-w-[440px] animate-[scaleIn_200ms_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}
