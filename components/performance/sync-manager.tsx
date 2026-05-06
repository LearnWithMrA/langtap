// ─────────────────────────────────────────────
// File: components/performance/sync-manager.tsx
// Purpose: Registers pagehide/visibilitychange listener for
//          sendBeacon sync. Provides SyncCheckpointContext so
//          game windows can call flushDirty after prompt completion.
//          Only active for signed-in permanent users.
// Depends on: hooks/useSyncCheckpoint.ts, stores/mastery.store.ts,
//             stores/word-mastery.store.ts
// ─────────────────────────────────────────────

'use client'

import { createContext, useContext, useEffect } from 'react'
import type { ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useSyncCheckpoint } from '@/hooks/useSyncCheckpoint'
import { useMasteryStore } from '@/stores/mastery.store'
import { useWordMasteryStore } from '@/stores/word-mastery.store'

// ── Context ───────────────────────────────────

type SyncContextValue = {
  flushDirty: () => Promise<void>
  isFlushInFlight: boolean
}

const SyncCheckpointContext = createContext<SyncContextValue>({
  flushDirty: async () => {},
  isFlushInFlight: false,
})

export function useSyncContext(): SyncContextValue {
  return useContext(SyncCheckpointContext)
}

// ── Beacon payload builder ────────────────────

function buildBeaconPayload(): string | null {
  const mastery = useMasteryStore.getState()
  const word = useWordMasteryStore.getState()

  const masteryRows = mastery.getDirtyScoreSnapshot()
  const masteryUnlockIds = mastery.getDirtyUnlockIds()
  const wordRows = word.getDirtyScoreSnapshot()
  const wordUnlockIds = word.getDirtyUnlockIds()

  if (
    masteryRows.length === 0 &&
    masteryUnlockIds.length === 0 &&
    wordRows.length === 0 &&
    wordUnlockIds.length === 0
  ) {
    return null
  }

  return JSON.stringify({
    mastery_epoch: mastery.epoch,
    mastery_rows: masteryRows.length > 0 ? masteryRows : undefined,
    mastery_unlock_ids: masteryUnlockIds.length > 0 ? masteryUnlockIds : undefined,
    word_epoch: word.epoch,
    word_rows: wordRows.length > 0 ? wordRows : undefined,
    word_unlock_ids: wordUnlockIds.length > 0 ? wordUnlockIds : undefined,
  })
}

// ── Main export ───────────────────────────────

export function SyncManager({ children }: { children: ReactNode }): ReactNode {
  const { isAuthenticated, isGuest } = useAuth()
  const checkpoint = useSyncCheckpoint()
  const isActive = isAuthenticated && !isGuest

  useEffect(() => {
    if (!isActive) return

    function handleVisibilityChange(): void {
      if (document.visibilityState !== 'hidden') return
      const payload = buildBeaconPayload()
      if (!payload) return
      const blob = new Blob([payload], { type: 'application/json' })
      navigator.sendBeacon('/api/sync', blob)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return (): void => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isActive])

  return (
    <SyncCheckpointContext.Provider value={checkpoint}>{children}</SyncCheckpointContext.Provider>
  )
}
