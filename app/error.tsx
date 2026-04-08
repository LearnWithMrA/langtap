// ------------------------------------------------------------
// File: app/error.tsx
// Purpose: Global error boundary. Shown when an unhandled error occurs.
//          Placeholder - to be implemented in Sprint 10.
// ------------------------------------------------------------

'use client'

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return null
}
