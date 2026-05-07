// ─────────────────────────────────────────────
// File: components/profile/reset-progress.tsx
// Purpose: Reset progress section for the profile screen. Non-optimistic:
//          shows spinner during RPC, updates local state only on success.
//          Awaits in-flight checkpoint before calling reset RPC.
//          Two-step confirmation modal for each reset type.
// Depends on: services/reset.service.ts, stores/mastery.store.ts,
//             stores/word-mastery.store.ts, stores/unlock.store.ts,
//             hooks/useSyncCheckpoint.ts, components/ui/modal.tsx
// ─────────────────────────────────────────────

'use client'

import { useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import { Modal } from '@/components/ui/modal'
import { resetAllMastery, resetAllWordMastery } from '@/services/reset.service'
import { useMasteryStore } from '@/stores/mastery.store'
import { useWordMasteryStore } from '@/stores/word-mastery.store'
import { useUnlockStore } from '@/stores/unlock.store'
import { useSyncCheckpoint } from '@/hooks/useSyncCheckpoint'

// ── Types ─────────────────────────────────────

type ResetTarget = 'kana' | 'kotoba' | null

// ── Main export ───────────────────────────────

export function ResetProgress(): ReactNode {
  const [confirmTarget, setConfirmTarget] = useState<ResetTarget>(null)
  const [isResetting, setIsResetting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { flushDirty } = useSyncCheckpoint()

  const handleReset = useCallback(async (): Promise<void> => {
    if (!confirmTarget || isResetting) return

    setIsResetting(true)
    setError(null)

    try {
      // Fence: wait for any in-flight checkpoint to complete before
      // calling reset, so the reset epoch is never overwritten by a
      // stale checkpoint response.
      await flushDirty()

      if (confirmTarget === 'kana') {
        const result = await resetAllMastery()
        if (result.ok) {
          useMasteryStore.getState().resetAll()
          useMasteryStore.getState().setEpoch(result.data.newEpoch)
          useUnlockStore.getState().recompute({}, new Set())
          setConfirmTarget(null)
        } else {
          setError(result.error)
        }
      } else {
        const result = await resetAllWordMastery()
        if (result.ok) {
          useWordMasteryStore.getState().resetAll()
          useWordMasteryStore.getState().setEpoch(result.data.newEpoch)
          setConfirmTarget(null)
        } else {
          setError(result.error)
        }
      }
    } catch {
      setError('Something went wrong. Please try again.')
    }

    setIsResetting(false)
  }, [confirmTarget, isResetting, flushDirty])

  const closeModal = useCallback((): void => {
    if (isResetting) return
    setConfirmTarget(null)
    setError(null)
  }, [isResetting])

  const modalTitle = confirmTarget === 'kana' ? 'Reset kana progress?' : 'Reset word progress?'
  const modalBody =
    confirmTarget === 'kana'
      ? 'This will reset all kana mastery scores and learning progress to zero, and remove all manual unlocks. This cannot be undone.'
      : 'This will reset all word mastery scores to zero and remove all manual word unlocks. This cannot be undone.'

  return (
    <>
      <div
        role="region"
        aria-label="Reset progress"
        className="bg-surface-raised rounded-2xl border border-border px-4 py-4"
      >
        <p className="text-xs font-medium text-warm-400 uppercase tracking-wider mb-3">
          Reset progress
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={(): void => setConfirmTarget('kana')}
            className="flex-1 bg-red-600/80 text-white rounded-xl px-4 py-3 text-sm font-medium shadow-[0_4px_0_0_#b04050] active:translate-y-[2px] active:shadow-none transition-all duration-75 min-h-[48px]"
          >
            Reset Kana
          </button>
          <button
            type="button"
            onClick={(): void => setConfirmTarget('kotoba')}
            className="flex-1 bg-red-600/80 text-white rounded-xl px-4 py-3 text-sm font-medium shadow-[0_4px_0_0_#b04050] active:translate-y-[2px] active:shadow-none transition-all duration-75 min-h-[48px]"
          >
            Reset Kotoba
          </button>
        </div>
      </div>

      <Modal
        isOpen={confirmTarget !== null}
        onClose={closeModal}
        onConfirm={handleReset}
        isDanger
        steps={[
          {
            title: modalTitle,
            body: (
              <div className="flex flex-col gap-2">
                <p className="text-sm text-warm-600">{modalBody}</p>
                {error !== null && <p className="text-sm text-red-600">{error}</p>}
                {isResetting && <p className="text-sm text-warm-400">Resetting...</p>}
              </div>
            ),
            confirmLabel: isResetting ? 'Resetting...' : 'Reset',
            cancelLabel: 'Cancel',
          },
        ]}
      />
    </>
  )
}
