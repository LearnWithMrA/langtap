// ─────────────────────────────────────────────
// File: components/profile/profile-client.tsx
// Purpose: Client component for the Profile screen visual shell.
//          Orchestrates header card, membership card, account settings,
//          support links, and danger zone. All data is from mock
//          fixtures. No Supabase calls. No real auth. Modals open
//          but submit is non-functional. Username inline edit works
//          in local state only.
// Depends on: components/layout/app-top-bar.tsx,
//             components/ui/modal.tsx,
//             components/profile/guest-banner.tsx,
//             components/profile/header-card.tsx,
//             components/profile/membership-card.tsx,
//             components/profile/account-settings.tsx,
//             components/layout/landing-footer.tsx,
//             samples/profile-fixtures.ts
// ─────────────────────────────────────────────

'use client'

import { useCallback, useState } from 'react'
import type { ReactNode } from 'react'
import { AppTopBar } from '@/components/layout/app-top-bar'
import { Modal } from '@/components/ui/modal'
import type { ProfileFixtureKey } from '@/samples/profile-fixtures'
import { getProfileFixture } from '@/samples/profile-fixtures'
import { GuestBanner } from '@/components/profile/guest-banner'
import { HeaderCard } from '@/components/profile/header-card'
import { MembershipCard } from '@/components/profile/membership-card'
import { AccountSettings } from '@/components/profile/account-settings'
import type { ModalType } from '@/components/profile/account-settings'
import { PreferencesCard } from '@/components/profile/preferences-card'
import { LandingFooter } from '@/components/layout/landing-footer'

// ── Main component ────────────────────────────

export function ProfileClient(): ReactNode {
  const [fixtureKey, setFixtureKey] = useState<ProfileFixtureKey>('free_user')
  const profile = getProfileFixture(fixtureKey)
  const [activeModal, setActiveModal] = useState<ModalType>(null)
  const [deleteInput, setDeleteInput] = useState('')

  const closeModal = useCallback((): void => {
    setActiveModal(null)
    setDeleteInput('')
  }, [])

  const deleteConfirmPhrase = `delete-${profile.username}`
  const canConfirmDelete = deleteInput === deleteConfirmPhrase

  return (
    <div className="min-h-svh bg-profile-bg flex flex-col">
      <AppTopBar />

      <main className="max-w-2xl mx-auto px-4 sm:px-8 pt-20 pb-16 flex-1 w-full">
        <div className="flex flex-col gap-6">
          {/* Guest conversion banner */}
          {profile.isGuest && <GuestBanner />}

          {/* Header card */}
          <HeaderCard profile={profile} onSignOut={(): void => setActiveModal('signout')} />

          {/* Membership card */}
          <MembershipCard />

          {/* Preferences card */}
          <PreferencesCard />

          {/* Account settings */}
          <AccountSettings profile={profile} onOpenModal={setActiveModal} />

          {/* Delete account */}
          <div className="mt-3 mb-3 flex justify-center">
            <button
              type="button"
              onClick={(): void => setActiveModal('delete')}
              aria-label="Delete your account"
              className="bg-red-800 text-white rounded-xl px-10 py-3 text-sm font-medium shadow-[0_4px_0_0_#6b1c1c] active:translate-y-[2px] active:shadow-none transition-all duration-75 min-h-[48px]"
            >
              Delete account
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <LandingFooter />

      {/* Email change modal */}
      <Modal
        isOpen={activeModal === 'email'}
        onClose={closeModal}
        onConfirm={closeModal}
        confirmClassName="!bg-profile-accent hover:!bg-profile-accent-dark"
        steps={[
          {
            title: 'Change email',
            body: (
              <div className="flex flex-col gap-3">
                <div>
                  <p className="text-xs text-warm-400 mb-1">Current email</p>
                  <p className="text-sm text-warm-600">{profile.email ?? 'None'}</p>
                </div>
                <div>
                  <label className="text-xs text-warm-400 block mb-1" htmlFor="new-email">
                    New email
                  </label>
                  <input
                    id="new-email"
                    type="email"
                    placeholder="you@example.com"
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm text-warm-800 bg-surface-raised focus:outline-none focus:ring-2 focus:ring-profile-accent/50"
                  />
                </div>
                <p className="text-xs text-warm-400">
                  We will send a confirmation link to your new email.
                </p>
              </div>
            ),
            confirmLabel: 'Update email',
            cancelLabel: 'Cancel',
          },
        ]}
      />

      {/* Password change modal */}
      <Modal
        isOpen={activeModal === 'password'}
        onClose={closeModal}
        onConfirm={closeModal}
        confirmClassName="!bg-profile-accent hover:!bg-profile-accent-dark"
        steps={[
          {
            title: 'Change password',
            body: (
              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-xs text-warm-400 block mb-1" htmlFor="current-password">
                    Current password
                  </label>
                  <input
                    id="current-password"
                    type="password"
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm text-warm-800 bg-surface-raised focus:outline-none focus:ring-2 focus:ring-profile-accent/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-warm-400 block mb-1" htmlFor="new-password">
                    New password
                  </label>
                  <input
                    id="new-password"
                    type="password"
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm text-warm-800 bg-surface-raised focus:outline-none focus:ring-2 focus:ring-profile-accent/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-warm-400 block mb-1" htmlFor="confirm-password">
                    Confirm new password
                  </label>
                  <input
                    id="confirm-password"
                    type="password"
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm text-warm-800 bg-surface-raised focus:outline-none focus:ring-2 focus:ring-profile-accent/50"
                  />
                </div>
              </div>
            ),
            confirmLabel: 'Update password',
            cancelLabel: 'Cancel',
          },
        ]}
      />

      {/* Sign out confirmation modal */}
      <Modal
        isOpen={activeModal === 'signout'}
        onClose={closeModal}
        onConfirm={closeModal}
        confirmClassName="!bg-profile-accent hover:!bg-profile-accent-dark"
        steps={[
          {
            title: 'Sign out',
            body: 'Are you sure you want to sign out?',
            confirmLabel: 'Sign out',
            cancelLabel: 'Cancel',
          },
        ]}
      />

      {/* Fixture selector (dev only, pinned to bottom) */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-4 py-2">
        <span className="text-xs text-white/70">Fixture:</span>
        {(['free_user', 'guest', 'recently_changed'] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={(): void => setFixtureKey(key)}
            className={`text-xs px-2 py-1 rounded-lg transition-colors duration-150 ${
              fixtureKey === key
                ? 'bg-white/80 text-warm-700 font-medium'
                : 'text-white/60 hover:bg-white/30'
            }`}
          >
            {key.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Delete account confirmation dialog */}
      {activeModal === 'delete' && (
        <div
          role="presentation"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <div aria-hidden="true" className="absolute inset-0 bg-warm-800/40" />
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e): void => e.stopPropagation()}
            className="relative bg-surface-raised border border-border rounded-2xl p-6 w-full max-w-sm shadow-lg"
          >
            <h2 className="text-xl font-medium text-text-primary mb-3">Delete account</h2>
            <div className="text-sm text-text-secondary mb-4 flex flex-col gap-3">
              <p>
                This will permanently delete your account and all progress. This cannot be undone.
              </p>
              <p>
                Type{' '}
                <span className="font-mono font-bold text-text-primary">{deleteConfirmPhrase}</span>{' '}
                to confirm.
              </p>
              <input
                type="text"
                value={deleteInput}
                onChange={(e): void => setDeleteInput(e.target.value)}
                placeholder={deleteConfirmPhrase}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm text-warm-800 bg-surface-raised focus:outline-none focus:ring-2 focus:ring-red-300"
                autoComplete="off"
                spellCheck={false}
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 rounded-xl px-4 py-2 text-sm font-medium text-text-secondary hover:bg-warm-100 transition-colors duration-150 min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={closeModal}
                disabled={!canConfirmDelete}
                className="flex-1 rounded-xl px-4 py-2 text-sm font-medium text-white bg-red-800 hover:bg-red-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 min-h-[44px]"
              >
                Delete my account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
