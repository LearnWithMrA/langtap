// ------------------------------------------------------------
// File: app/error.tsx
// Purpose: Root error boundary. Catches unhandled render and data
//          errors anywhere below the root layout and shows a calm,
//          recoverable screen with retry and home actions. Never
//          exposes raw error messages to the user.
// ------------------------------------------------------------

'use client'

import type { ReactNode } from 'react'
import { ErrorScreen } from '@/components/layout/error-screen'

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}): ReactNode {
  return <ErrorScreen digest={error.digest} onRetry={reset} />
}
