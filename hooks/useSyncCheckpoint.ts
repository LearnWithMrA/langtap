// ─────────────────────────────────────────────
// File: hooks/useSyncCheckpoint.ts
// Purpose: Checkpoint sync hook for signed-in users. Flushes
//          dirty mastery and word mastery scores to the server
//          via epoch-aware checkpoint RPCs. Handles stale epoch
//          responses by discarding local state and reloading.
//          Exposes flushDirty() for prompt-completion sync and
//          isFlushInFlight for reset sync-fence.
//          Disabled for guest users.
// Depends on: stores/mastery.store.ts, stores/word-mastery.store.ts,
//             services/mastery.service.ts, services/word-mastery.service.ts,
//             hooks/useAuth.ts
// ─────────────────────────────────────────────

'use client'

import { useCallback, useRef } from 'react'
import { useMasteryStore } from '@/stores/mastery.store'
import { useWordMasteryStore } from '@/stores/word-mastery.store'
import { useUserStore } from '@/stores/user.store'
import { useAuth } from '@/hooks/useAuth'
import {
  checkpointMastery,
  checkpointKanaUnlocks,
  loadMasterySnapshot,
} from '@/services/mastery.service'
import {
  checkpointWordMastery,
  checkpointWordUnlocks,
  loadWordMasterySnapshot,
} from '@/services/word-mastery.service'
import type { CheckpointResult } from '@/services/mastery.service'

// ── Types ─────────────────────────────────────

type SyncCheckpoint = {
  flushDirty: () => Promise<void>
  isFlushInFlight: boolean
}

// ── Hook ──────────────────────────────────────

export function useSyncCheckpoint(): SyncCheckpoint {
  const { isAuthenticated, isGuest } = useAuth()
  const flushInFlightRef = useRef(false)
  const flushPromiseRef = useRef<Promise<void> | null>(null)

  const flushDirty = useCallback(async (): Promise<void> => {
    if (!isAuthenticated || isGuest) return
    if (flushInFlightRef.current && flushPromiseRef.current) {
      await flushPromiseRef.current
      return
    }

    flushInFlightRef.current = true
    const promise = doFlush()
    flushPromiseRef.current = promise

    try {
      await promise
    } finally {
      flushInFlightRef.current = false
      flushPromiseRef.current = null
    }
  }, [isAuthenticated, isGuest])

  return {
    flushDirty,
    get isFlushInFlight(): boolean {
      return flushInFlightRef.current
    },
  }
}

// ── Flush implementation ──────────────────────

async function doFlush(): Promise<void> {
  await Promise.all([flushMastery(), flushWordMastery()])
}

async function flushMastery(): Promise<void> {
  const store = useMasteryStore.getState()
  const epoch = store.epoch
  const dirtySnapshot = new Map(store.dirtyVersions)

  const rows = store.getDirtyScoreSnapshot()
  const unlockIds = store.getDirtyUnlockIds()

  if (rows.length === 0 && unlockIds.length === 0) return

  const results: Array<{ ok: boolean; data?: CheckpointResult }> = []

  if (rows.length > 0) {
    const result = await checkpointMastery(rows, epoch)
    if (!result.ok) return
    results.push({ ok: true, data: result.data })
  }

  if (unlockIds.length > 0) {
    const result = await checkpointKanaUnlocks(unlockIds, epoch)
    if (!result.ok) return
    results.push({ ok: true, data: result.data })
  }

  for (const r of results) {
    if (!r.data) continue

    if (r.data.skippedStaleCount > 0) {
      await handleStaleEpoch('mastery', r.data.currentEpoch)
      return
    }

    useMasteryStore.getState().clearDirtyIfMatch(dirtySnapshot)

    if (r.data.droppedInvalidIds.length > 0) {
      const droppedMap = new Map<string, number>()
      for (const id of r.data.droppedInvalidIds) {
        const ver = dirtySnapshot.get(id)
        if (ver !== undefined) droppedMap.set(id, ver)
      }
      useMasteryStore.getState().clearDirtyIfMatch(droppedMap)
    }

    useMasteryStore.getState().setEpoch(r.data.currentEpoch)
  }

  if (unlockIds.length > 0) {
    useMasteryStore.getState().clearDirtyUnlocks(unlockIds)
  }
}

async function flushWordMastery(): Promise<void> {
  const store = useWordMasteryStore.getState()
  const epoch = store.epoch
  const dirtySnapshot = new Map(store.dirtyVersions)

  const rows = store.getDirtyScoreSnapshot()
  const unlockIds = store.getDirtyUnlockIds()

  if (rows.length === 0 && unlockIds.length === 0) return

  const results: Array<{ ok: boolean; data?: CheckpointResult }> = []

  if (rows.length > 0) {
    const result = await checkpointWordMastery(rows, epoch)
    if (!result.ok) return
    results.push({ ok: true, data: result.data })
  }

  if (unlockIds.length > 0) {
    const result = await checkpointWordUnlocks(unlockIds, epoch)
    if (!result.ok) return
    results.push({ ok: true, data: result.data })
  }

  for (const r of results) {
    if (!r.data) continue

    if (r.data.skippedStaleCount > 0) {
      await handleStaleEpoch('wordMastery', r.data.currentEpoch)
      return
    }

    useWordMasteryStore.getState().clearDirtyIfMatch(dirtySnapshot)

    if (r.data.droppedInvalidIds.length > 0) {
      const droppedMap = new Map<string, number>()
      for (const id of r.data.droppedInvalidIds) {
        const ver = dirtySnapshot.get(id)
        if (ver !== undefined) droppedMap.set(id, ver)
      }
      useWordMasteryStore.getState().clearDirtyIfMatch(droppedMap)
    }

    useWordMasteryStore.getState().setEpoch(r.data.currentEpoch)
  }

  if (unlockIds.length > 0) {
    useWordMasteryStore.getState().clearDirtyUnlocks(unlockIds)
  }
}

// ── Stale epoch handler ───────────────────────

async function handleStaleEpoch(
  domain: 'mastery' | 'wordMastery',
  serverEpoch: number,
): Promise<void> {
  // Load replacement data first, then replace+clear.
  // On failure, keep old data but update epoch to prevent infinite stale loops.
  if (domain === 'mastery') {
    const result = await loadMasterySnapshot()
    if (result.ok) {
      useMasteryStore
        .getState()
        .replaceAll(result.data.scores, result.data.learningScores, result.data.epoch)
      useMasteryStore.getState().clearAllDirty()
    } else {
      useMasteryStore.getState().setEpoch(serverEpoch)
      useMasteryStore.getState().clearAllDirty()
    }
  } else {
    const result = await loadWordMasterySnapshot()
    if (result.ok) {
      useWordMasteryStore
        .getState()
        .replaceAll(result.data.scores, result.data.unlockIds, result.data.epoch)
      useWordMasteryStore.getState().clearAllDirty()
    } else {
      useWordMasteryStore.getState().setEpoch(serverEpoch)
      useWordMasteryStore.getState().clearAllDirty()
    }
  }

  useUserStore.getState().setServerHydrated(true)
}
