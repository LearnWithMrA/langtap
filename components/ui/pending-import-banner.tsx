// ─────────────────────────────────────────────
// File: components/ui/pending-import-banner.tsx
// Purpose: Banner shown when guest import failed transiently and
//          the user is quarantined on pending keys. Offers Retry
//          and Start fresh actions. Non-dismissable.
// Depends on: stores/user.store.ts
// ─────────────────────────────────────────────

'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import { useUserStore } from '@/stores/user.store'

// ── Types ─────────────────────────────────────

type PendingImportBannerProps = {
  onRetry: () => Promise<void>
  onStartFresh: () => Promise<void>
}

// ── Main export ───────────────────────────────

export function PendingImportBanner({
  onRetry,
  onStartFresh,
}: PendingImportBannerProps): ReactNode {
  const pendingGuestImport = useUserStore((s) => s.pendingGuestImport)
  const [isRetrying, setIsRetrying] = useState(false)
  const [isStartingFresh, setIsStartingFresh] = useState(false)

  if (!pendingGuestImport) return null

  const isBusy = isRetrying || isStartingFresh

  async function handleRetry(): Promise<void> {
    setIsRetrying(true)
    try {
      await onRetry()
    } finally {
      setIsRetrying(false)
    }
  }

  async function handleStartFresh(): Promise<void> {
    setIsStartingFresh(true)
    try {
      await onStartFresh()
    } finally {
      setIsStartingFresh(false)
    }
  }

  return (
    <div className="fixed top-14 right-0 left-0 z-40 border-b border-[#e8dfd0] bg-[#f5efe3] px-4 py-2">
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
        <p className="text-sm text-[#6b6560]">Your practice progress could not be imported.</p>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={handleRetry}
            disabled={isBusy}
            className="rounded-lg bg-[#7c9a6e] px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-[#6b8a5e] disabled:opacity-60"
            aria-label="Retry import"
          >
            {isRetrying ? 'Retrying...' : 'Retry'}
          </button>
          <button
            onClick={handleStartFresh}
            disabled={isBusy}
            className="rounded-lg bg-[#e8dfd0] px-3 py-1 text-sm font-medium text-[#6b6560] transition-colors hover:bg-[#ddd4c4] disabled:opacity-60"
            aria-label="Start fresh without importing"
          >
            {isStartingFresh ? 'Starting...' : 'Start fresh'}
          </button>
        </div>
      </div>
    </div>
  )
}
