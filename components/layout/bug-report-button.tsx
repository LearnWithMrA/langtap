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
        <div className="flex items-center gap-1.5 bg-white/40 backdrop-blur-sm rounded-lg px-2 py-1.5">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            aria-label={LABEL}
            className="h-7 w-7 flex items-center justify-center rounded-full bg-white/50 text-warm-800 hover:text-sage-400 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-sage-300 cursor-pointer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </button>
        </div>
      </div>
      <BugReportModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}
