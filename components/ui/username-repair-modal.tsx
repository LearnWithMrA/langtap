// ─────────────────────────────────────────────
// File: components/ui/username-repair-modal.tsx
// Purpose: Soft prompt for OAuth users to replace their default
//          username (user_[uuid-prefix]) with a chosen one. Uses
//          the existing change_username RPC. Dismissable at first;
//          after 3 dismissals, becomes blocking.
// Depends on: hooks/useUsernameRepair.ts, services/profile.service.ts,
//             stores/user.store.ts
// ─────────────────────────────────────────────

'use client'

import { useCallback, useState } from 'react'
import type { ReactNode } from 'react'
import { useUsernameRepair } from '@/hooks/useUsernameRepair'
import { changeUsername } from '@/services/profile.service'
import { useUserStore } from '@/stores/user.store'

// ── Constants ─────────────────────────────────

const USERNAME_MIN = 3
const USERNAME_MAX = 20
const USERNAME_PATTERN = /^[a-zA-Z0-9_]+$/

const ERROR_MESSAGES: Record<string, string> = {
  cooldown_active: 'Username change is on cooldown.',
  invalid_format: 'Username must be 3-20 characters (letters, numbers, underscores).',
  username_taken: 'That username is already taken.',
  unauthorized: 'You must be signed in to change your username.',
  network: 'Something went wrong. Please try again.',
  unknown: 'Something went wrong. Please try again.',
  validation: '',
}

// ── Component ─────────────────────────────────

export function UsernameRepairModal(): ReactNode {
  const { shouldShow, isBlocking, dismiss } = useUsernameRepair()
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = useCallback(async (): Promise<void> => {
    const trimmed = value.trim()

    if (trimmed.length < USERNAME_MIN || trimmed.length > USERNAME_MAX) {
      setError('Username must be 3-20 characters.')
      return
    }
    if (!USERNAME_PATTERN.test(trimmed)) {
      setError('Letters, numbers, and underscores only.')
      return
    }

    setIsSaving(true)
    setError(null)

    const result = await changeUsername(trimmed)

    setIsSaving(false)

    if (result.ok) {
      const profile = useUserStore.getState().profile
      if (profile) {
        useUserStore.getState().setProfile({
          ...profile,
          username: trimmed,
          usernameChangedAt: new Date().toISOString(),
        })
      }
    } else {
      setError(ERROR_MESSAGES[result.errorCode] ?? ERROR_MESSAGES.unknown)
    }
  }, [value])

  const handleClose = useCallback((): void => {
    if (isBlocking) return
    dismiss()
  }, [isBlocking, dismiss])

  if (!shouldShow) return null

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={isBlocking ? undefined : handleClose}
    >
      <div aria-hidden="true" className="absolute inset-0 bg-warm-800/40" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Choose your username"
        onClick={(e): void => e.stopPropagation()}
        className="relative bg-surface-raised border border-border rounded-2xl p-6 w-full max-w-sm shadow-lg"
      >
        <h2 className="text-xl font-medium text-text-primary mb-2">Choose your username</h2>
        <p className="text-sm text-text-secondary mb-4">
          {isBlocking
            ? 'Please choose a username before continuing.'
            : 'Your username is visible on the leaderboard. Pick something you like.'}
        </p>

        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs text-warm-400 block mb-1" htmlFor="repair-username">
              Username
            </label>
            <input
              id="repair-username"
              type="text"
              value={value}
              onChange={(e): void => setValue(e.target.value)}
              maxLength={USERNAME_MAX}
              placeholder="your_username"
              className="w-full border border-border rounded-lg px-3 py-2 text-sm text-warm-800 bg-surface-raised focus:outline-none focus:ring-2 focus:ring-profile-accent/50"
              autoFocus
            />
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-warm-400">
                {value.length} / {USERNAME_MAX}
              </span>
            </div>
          </div>

          {error !== null && <p className="text-xs text-red-600">{error}</p>}

          <div className="flex gap-3">
            {!isBlocking && (
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 rounded-xl px-4 py-2 text-sm font-medium text-text-secondary hover:bg-warm-100 transition-colors duration-150 min-h-[44px]"
              >
                Later
              </button>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || value.trim().length < USERNAME_MIN}
              className="flex-1 rounded-xl px-4 py-2 text-sm font-medium text-white bg-profile-accent hover:bg-profile-accent-dark disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 min-h-[44px]"
            >
              {isSaving ? 'Saving...' : 'Save username'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
