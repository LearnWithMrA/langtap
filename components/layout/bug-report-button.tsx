// ─────────────────────────────────────────────
// File: components/layout/bug-report-button.tsx
// Purpose: Fixed bottom-left bug report button. Opens the bug
//          report modal on click. Only visible for signed-in users.
//          Same translucent styling as the lo-fi player at bottom-right.
// Depends on: components/layout/bug-report-modal.tsx, hooks/useAuth.ts
// ─────────────────────────────────────────────

'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { BugReportModal } from '@/components/layout/bug-report-modal'

// ── Constants ─────────────────────────────────

const LABEL = 'Report a bug'

// ── Component ─────────────────────────────────

export function BugReportButton(): ReactNode {
  const { isAuthenticated } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  if (!isAuthenticated) return null

  return (
    <>
      <div className="fixed bottom-4 left-4 z-20">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label={LABEL}
          className="flex items-center justify-center w-8 h-8 bg-white/40 backdrop-blur-sm rounded-lg text-warm-600 text-sm font-bold hover:bg-white/60 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-sage-300 cursor-pointer"
        >
          ?
        </button>
      </div>
      <BugReportModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}
