// ------------------------------------------------------------
// File: app/global-error.tsx
// Purpose: Last-resort error boundary. Catches errors thrown by the
//          root layout itself, where app/error.tsx cannot render.
//          Must provide its own <html> and <body> because the root
//          layout has failed. Inline-styled deliberately: globals.css
//          may not have loaded when this renders (documented exception
//          to the no-inline-styles rule).
// ------------------------------------------------------------

'use client'

import type { ReactNode } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}): ReactNode {
  return (
    <html lang="en">
      <body
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#faf8f4',
          fontFamily: 'system-ui, sans-serif',
          margin: 0,
          padding: '1rem',
        }}
      >
        <main style={{ textAlign: 'center', maxWidth: '28rem' }}>
          <h1 style={{ color: '#3d3028', fontSize: '1.5rem', marginBottom: '0.5rem' }}>
            Something went wrong
          </h1>
          <p style={{ color: '#7a6a5a', marginBottom: '1.5rem' }}>
            Take a breath and try again. Your progress is saved.
          </p>
          <button
            type="button"
            onClick={reset}
            aria-label="Try again"
            style={{
              background: '#5a8a50',
              color: '#ffffff',
              border: 'none',
              borderRadius: '0.75rem',
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
              minHeight: '44px',
              minWidth: '44px',
            }}
          >
            Try again
          </button>
          {error.digest && (
            <p style={{ color: '#b8a898', fontSize: '0.75rem', marginTop: '1rem' }}>
              Error reference: {error.digest}
            </p>
          )}
        </main>
      </body>
    </html>
  )
}
