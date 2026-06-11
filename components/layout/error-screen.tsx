// ------------------------------------------------------------
// File: components/layout/error-screen.tsx
// Purpose: Calm full-screen error state shared by the root and global
//          error boundaries. Shows a friendly message, a retry button,
//          and a link home. Raw error details are never rendered; only
//          the opaque Next.js digest is shown for support reference.
// Depends on: theme tokens (app/globals.css)
// ------------------------------------------------------------

'use client'

import type { ReactNode } from 'react'

// -- Types ----------------------------------------------------

type ErrorScreenProps = {
  digest?: string
  onRetry: () => void
}

// -- Component ------------------------------------------------

export function ErrorScreen({ digest, onRetry }: ErrorScreenProps): ReactNode {
  return (
    <main className="min-h-screen flex items-center justify-center bg-cream px-4">
      <div className="bg-white rounded-2xl shadow-[0_6px_0_0_rgba(0,0,0,0.06)] w-full max-w-md p-8 text-center">
        <p className="text-5xl mb-4" aria-hidden="true">
          🍵
        </p>
        <h1 className="text-2xl font-bold text-warm-800 mb-2">Something went wrong</h1>
        <p className="text-base text-warm-600 mb-6">
          Take a breath. Your progress is saved. Try again, or head back home.
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="w-full min-h-11 bg-sage-500 hover:bg-sage-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors mb-3"
          aria-label="Try again"
        >
          Try again
        </button>
        <a
          href="/home"
          className="inline-block min-h-11 leading-[2.75rem] text-sm text-sage-600 hover:text-sage-500 font-medium"
          aria-label="Go back home"
        >
          Back to home
        </a>
        {digest && <p className="text-xs text-warm-400 mt-4">Error reference: {digest}</p>}
      </div>
    </main>
  )
}
