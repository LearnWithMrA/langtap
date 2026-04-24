// ─────────────────────────────────────────────
// File: components/profile/account-settings.tsx
// Purpose: Account settings card with editable username, email,
//          password, and distance-unit rows. Username edit is inline
//          with a 30-day cooldown display. Email and password rows
//          open modals via the onOpenModal callback.
// Depends on: components/profile/profile-helpers.ts,
//             components/profile/profile-icons.tsx,
//             samples/profile-fixtures.ts
// ─────────────────────────────────────────────

'use client'

import { useCallback, useState } from 'react'
import type { ReactNode } from 'react'
import type { ProfileFixture } from '@/samples/profile-fixtures'
import { daysUntilNextChange, formatNextChangeDate } from '@/components/profile/profile-helpers'
import { IconChevron, IconPencil } from '@/components/profile/profile-icons'

// ── Types ─────────────────────────────────────

export type ModalType = 'email' | 'password' | 'signout' | 'delete' | null

// ── Main export ───────────────────────────────

export function AccountSettings({
  profile,
  onOpenModal,
}: {
  profile: ProfileFixture
  onOpenModal: (type: ModalType) => void
}): ReactNode {
  const [isEditingUsername, setIsEditingUsername] = useState(false)
  const [editValue, setEditValue] = useState(profile.username)
  const [unit, setUnit] = useState(profile.distanceUnit)

  const canChangeUsername =
    !profile.usernameChangedAt || daysUntilNextChange(profile.usernameChangedAt) === 0
  const usernameLockedDays = profile.usernameChangedAt
    ? daysUntilNextChange(profile.usernameChangedAt)
    : 0

  const handleUsernameEdit = useCallback((): void => {
    if (!canChangeUsername) return
    setEditValue(profile.username)
    setIsEditingUsername(true)
  }, [canChangeUsername, profile.username])

  const handleUsernameSave = useCallback((): void => {
    setIsEditingUsername(false)
  }, [])

  const handleUsernameCancel = useCallback((): void => {
    setEditValue(profile.username)
    setIsEditingUsername(false)
  }, [profile.username])

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
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-warm-400">{editValue.length} / 20</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleUsernameCancel}
                  className="text-sm text-warm-500 hover:text-warm-700 px-3 py-1.5 rounded-lg hover:bg-warm-100 transition-colors duration-150"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUsernameSave}
                  className="text-sm text-white bg-profile-accent hover:bg-profile-accent-dark px-3 py-1.5 rounded-lg transition-colors duration-150"
                >
                  Save
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
              <span className="text-sm text-warm-500">{profile.username}</span>
              <span className={canChangeUsername ? 'text-warm-300' : 'text-warm-300 opacity-30'}>
                <IconPencil />
              </span>
            </div>
          </button>
        )}
        {!canChangeUsername && usernameLockedDays > 0 && !isEditingUsername && (
          <p className="text-xs text-warm-400 px-4 pb-2 -mt-1">
            Next change available {formatNextChangeDate(profile.usernameChangedAt!)}
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
            <span className="text-sm text-warm-500">{profile.email ?? 'No email'}</span>
            <span className="text-warm-300">
              {profile.email ? <IconPencil /> : <IconChevron />}
            </span>
          </div>
        </button>
      </div>

      {/* Password row (hidden for guests) */}
      {!profile.isGuest && (
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
          onClick={(): void => setUnit(unit === 'metric' ? 'imperial' : 'metric')}
          className="w-full px-4 py-3 flex items-center justify-between min-h-[48px] hover:bg-warm-50 transition-colors duration-150"
        >
          <span className="text-sm font-medium text-warm-700">Distance units</span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-warm-500">
              {unit === 'metric' ? 'Metric (km)' : 'Imperial (mi)'}
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
