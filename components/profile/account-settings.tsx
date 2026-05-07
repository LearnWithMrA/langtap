// ─────────────────────────────────────────────
// File: components/profile/account-settings.tsx
// Purpose: Account settings card with editable username (via RPC
//          with 30-day cooldown), email, password, and distance-unit
//          rows. Wired to real Supabase data. Username changes go
//          through the change_username RPC. Distance unit persists
//          to profile via updateProfile with optimistic rollback.
// Depends on: components/profile/profile-helpers.ts,
//             components/profile/profile-icons.tsx,
//             services/profile.service.ts,
//             stores/user.store.ts, hooks/useAuth.ts
// ─────────────────────────────────────────────

'use client'

import { useCallback, useState } from 'react'
import type { ReactNode } from 'react'
import { daysUntilNextChange, formatNextChangeDate } from '@/components/profile/profile-helpers'
import { IconChevron, IconPencil } from '@/components/profile/profile-icons'
import { useUserStore } from '@/stores/user.store'
import { useAuth } from '@/hooks/useAuth'
import { changeUsername, updateProfile } from '@/services/profile.service'

// ── Types ─────────────────────────────────────

export type ModalType = 'email' | 'password' | 'signout' | 'delete' | null

// ── Constants ─────────────────────────────────

const USERNAME_ERROR_MESSAGES: Record<string, string> = {
  cooldown_active: 'Username change is on cooldown.',
  invalid_format: 'Username must be 3-20 characters (letters, numbers, underscores).',
  username_taken: 'That username is already taken.',
  unauthorized: 'You must be signed in to change your username.',
  network: 'Something went wrong. Please try again.',
  unknown: 'Something went wrong. Please try again.',
}

// ── Main export ───────────────────────────────

export function AccountSettings({
  onOpenModal,
}: {
  onOpenModal: (type: ModalType) => void
}): ReactNode {
  const { user, profile, isGuest } = useAuth()
  const setProfile = useUserStore((s) => s.setProfile)

  const username = profile?.username ?? ''
  const email = user?.email ?? null
  const distanceUnit = profile?.distanceUnit ?? 'metric'
  const usernameChangedAt = profile?.usernameChangedAt ?? null

  const [isEditingUsername, setIsEditingUsername] = useState(false)
  const [editValue, setEditValue] = useState(username)
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [isSavingUsername, setIsSavingUsername] = useState(false)

  const canChangeUsername = !usernameChangedAt || daysUntilNextChange(usernameChangedAt) === 0
  const usernameLockedDays = usernameChangedAt ? daysUntilNextChange(usernameChangedAt) : 0

  const handleUsernameEdit = useCallback((): void => {
    if (!canChangeUsername) return
    setEditValue(username)
    setUsernameError(null)
    setIsEditingUsername(true)
  }, [canChangeUsername, username])

  const handleUsernameSave = useCallback(async (): Promise<void> => {
    const trimmed = editValue.trim()
    if (trimmed === username) {
      setIsEditingUsername(false)
      return
    }

    setIsSavingUsername(true)
    setUsernameError(null)

    const result = await changeUsername(trimmed)

    setIsSavingUsername(false)

    if (result.ok) {
      if (profile) {
        setProfile({
          ...profile,
          username: trimmed,
          usernameChangedAt: new Date().toISOString(),
        })
      }
      setIsEditingUsername(false)
    } else {
      setUsernameError(USERNAME_ERROR_MESSAGES[result.errorCode] ?? USERNAME_ERROR_MESSAGES.unknown)
    }
  }, [editValue, username, profile, setProfile])

  const handleUsernameCancel = useCallback((): void => {
    setEditValue(username)
    setUsernameError(null)
    setIsEditingUsername(false)
  }, [username])

  const handleDistanceToggle = useCallback((): void => {
    if (!user || !profile) return

    const newUnit = distanceUnit === 'metric' ? 'imperial' : 'metric'
    const previous = profile.distanceUnit
    setProfile({ ...profile, distanceUnit: newUnit })

    void updateProfile(user.id, { distance_unit: newUnit }).then((result) => {
      if (!result.ok) {
        setProfile({ ...profile, distanceUnit: previous })
      }
    })
  }, [user, profile, distanceUnit, setProfile])

  return (
    <div
      role="region"
      aria-label="Account settings"
      className="bg-surface-raised rounded-2xl border border-border"
    >
      <p className="text-xs font-medium text-warm-400 uppercase tracking-wider px-4 pt-4 pb-0">
        Account
      </p>

      {/* Username row */}
      <div className="border-b border-border">
        {isEditingUsername ? (
          <div className="px-4 py-3">
            <label className="text-sm font-medium text-warm-700 block mb-1">Username</label>
            <input
              type="text"
              value={editValue}
              onChange={(e): void => setEditValue(e.target.value)}
              maxLength={20}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm text-warm-800 bg-surface-raised focus:outline-none focus:ring-2 focus:ring-profile-accent/50"
              autoFocus
            />
            {usernameError !== null && <p className="text-xs text-red-600 mt-1">{usernameError}</p>}
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-warm-400">{editValue.length} / 20</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleUsernameCancel}
                  disabled={isSavingUsername}
                  className="text-sm text-warm-500 hover:text-warm-700 px-3 py-1.5 rounded-lg hover:bg-warm-100 transition-colors duration-150"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUsernameSave}
                  disabled={isSavingUsername}
                  className="text-sm text-white bg-profile-accent hover:bg-profile-accent-dark px-3 py-1.5 rounded-lg transition-colors duration-150 disabled:opacity-60"
                >
                  {isSavingUsername ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleUsernameEdit}
            disabled={!canChangeUsername}
            className="w-full px-4 py-3 flex items-center justify-between min-h-[48px] hover:bg-warm-50 transition-colors duration-150 disabled:cursor-not-allowed"
          >
            <span className="text-sm font-medium text-warm-700">Username</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-warm-500">{username}</span>
              <span className={canChangeUsername ? 'text-warm-300' : 'text-warm-300 opacity-30'}>
                <IconPencil />
              </span>
            </div>
          </button>
        )}
        {!canChangeUsername && usernameLockedDays > 0 && !isEditingUsername && (
          <p className="text-xs text-warm-400 px-4 pb-2 -mt-1">
            Next change available {formatNextChangeDate(usernameChangedAt!)}
          </p>
        )}
      </div>

      {/* Email row */}
      <div className="border-b border-border">
        <button
          type="button"
          onClick={(): void => onOpenModal('email')}
          className="w-full px-4 py-3 flex items-center justify-between min-h-[48px] hover:bg-warm-50 transition-colors duration-150"
        >
          <span className="text-sm font-medium text-warm-700">Email</span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-warm-500">{email ?? 'No email'}</span>
            <span className="text-warm-300">{email ? <IconPencil /> : <IconChevron />}</span>
          </div>
        </button>
      </div>

      {/* Password row (hidden for guests) */}
      {!isGuest && (
        <div className="border-b border-border">
          <button
            type="button"
            onClick={(): void => onOpenModal('password')}
            className="w-full px-4 py-3 flex items-center justify-between min-h-[48px] hover:bg-warm-50 transition-colors duration-150"
          >
            <span className="text-sm font-medium text-warm-700">Password</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-profile-accent-dark">Change password</span>
              <span className="text-warm-300">
                <IconChevron />
              </span>
            </div>
          </button>
        </div>
      )}

      {/* Units row */}
      <div>
        <button
          type="button"
          onClick={handleDistanceToggle}
          className="w-full px-4 py-3 flex items-center justify-between min-h-[48px] hover:bg-warm-50 transition-colors duration-150"
        >
          <span className="text-sm font-medium text-warm-700">Distance units</span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-warm-500">
              {distanceUnit === 'metric' ? 'Metric (km)' : 'Imperial (mi)'}
            </span>
            <span className="text-warm-300">
              <IconChevron />
            </span>
          </div>
        </button>
      </div>
    </div>
  )
}
