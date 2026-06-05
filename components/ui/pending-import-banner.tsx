// ─────────────────────────────────────────────
// File: components/ui/pending-import-banner.tsx
// Purpose: INERT. Guest import flow disconnected in Sprint 14.
//          Flagged for owner deletion.
// ─────────────────────────────────────────────

'use client'

import type { ReactNode } from 'react'

type PendingImportBannerProps = {
  onRetry: () => Promise<void>
  onStartFresh: () => Promise<void>
}

export function PendingImportBanner(_props: PendingImportBannerProps): ReactNode {
  return null
}
