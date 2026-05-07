// ─────────────────────────────────────────────
// File: components/profile/profile-client.tsx
// Purpose: Client component for the Profile screen. Wired to real
//          Supabase data via useAuth and useUserStore. Email and
//          password change modals call auth.service. Sign out calls
//          the sign-out route handler. Delete account is a placeholder
//          (Plan 10).
// Depends on: hooks/useAuth.ts, stores/user.store.ts,
//             services/auth.service.ts, components/profile/*,
//             components/ui/modal.tsx
// ─────────────────────────────────────────────

'use client'

import { useCallback, useState } from 'react'
import type { ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Modal } from '@/components/ui/modal'
import { updateEmail, updatePassword, deleteAccount } from '@/services/auth.service'
import { clearAllUserLocalStorage } from '@/stores/scoped-storage'
import { useUserStore } from '@/stores/user.store'
import { HeaderCard } from '@/components/profile/header-card'
import { MembershipCard } from '@/components/profile/membership-card'
import { AccountSettings } from '@/components/profile/account-settings'
import type { ModalType } from '@/components/profile/account-settings'
import { PreferencesCard } from '@/components/profile/preferences-card'
import { ResetProgress } from '@/components/profile/reset-progress'
import { LandingFooter } from '@/components/layout/landing-footer'

// ── Main component ────────────────────────────

export function ProfileClient(): ReactNode {
  const { user, profile, isGuest } = useAuth()
  const [activeModal, setActiveModal] = useState<ModalType>(null)
  const [deleteInput, setDeleteInput] = useState('')
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [modalError, setModalError] = useState<string | null>(null)
  const [modalSuccess, setModalSuccess] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const closeModal = useCallback((): void => {
    if (isDeleting) return
    setActiveModal(null)
    setDeleteInput('')
    setDeletePassword('')
    setDeleteError(null)
    setNewEmail('')
    setNewPassword('')
    setConfirmPassword('')
    setModalError(null)
    setModalSuccess(null)
    setIsSubmitting(false)
  }, [isDeleting])

  const username = profile?.username ?? 'Guest'
  const deleteConfirmPhrase = `delete-${username}`
  const canConfirmDelete = deleteInput === deleteConfirmPhrase

  // Server checks user.identities for provider detection. Client always
  // shows the password field; if the user is OAuth-only the server skips
  // password verification and the field is harmless.
  const showPasswordOnDelete = true

  const handleDeleteAccount = useCallback(async (): Promise<void> => {
    if (!canConfirmDelete || isDeleting) return

    setIsDeleting(true)
    setDeleteError(null)

    const result = await deleteAccount(deleteInput, deletePassword || undefined)

    if (result.ok) {
      if (user?.id) clearAllUserLocalStorage(user.id)
      useUserStore.getState().clear()
      window.location.href = '/'
    } else {
      setDeleteError(result.error ?? 'Failed to delete account.')
      setIsDeleting(false)
    }
  }, [canConfirmDelete, isDeleting, deleteInput, deletePassword, user?.id])

  const handleEmailChange = useCallback(async (): Promise<void> => {
    setModalError(null)
    setIsSubmitting(true)
    const result = await updateEmail(newEmail)
    setIsSubmitting(false)
    if (result.ok) {
      setModalSuccess('Check your new email for a confirmation link.')
    } else {
      setModalError(result.error ?? 'Failed to update email.')
    }
  }, [newEmail])

  const handlePasswordChange = useCallback(async (): Promise<void> => {
    if (newPassword !== confirmPassword) {
      setModalError('Passwords do not match.')
      return
    }
    setModalError(null)
    setIsSubmitting(true)
    const result = await updatePassword(newPassword)
    setIsSubmitting(false)
    if (result.ok) {
      setModalSuccess('Password updated successfully.')
    } else {
      setModalError(result.error ?? 'Failed to update password.')
    }
  }, [newPassword, confirmPassword])

  const handleSignOut = useCallback((): void => {
    const form = document.createElement('form')
    form.method = 'POST'
    form.action = '/api/auth/sign-out'
    document.body.appendChild(form)
    form.submit()
  }, [])

  return (
    <div className="min-h-svh bg-profile-bg flex flex-col">
      <main className="max-w-2xl mx-auto px-4 sm:px-8 pt-20 pb-16 flex-1 w-full">
        <div className="flex flex-col gap-6">
          {/* Header card */}
          <HeaderCard
            profile={profile}
            isGuest={isGuest}
            onSignOut={(): void => setActiveModal('signout')}
          />

          {/* Membership card */}
          <MembershipCard />

          {/* Preferences card */}
          <PreferencesCard />

          {/* Account settings */}
          <AccountSettings onOpenModal={setActiveModal} />

          {/* Reset progress */}
          {!isGuest && <ResetProgress />}

          {/* Delete account */}
          {!isGuest && (
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
          )}
        </div>
      </main>

      {/* Footer */}
      <LandingFooter />

      {/* Email change modal */}
      <Modal
        isOpen={activeModal === 'email'}
        onClose={closeModal}
        onConfirm={modalSuccess ? closeModal : handleEmailChange}
        confirmClassName="!bg-profile-accent hover:!bg-profile-accent-dark"
        steps={[
          {
            title: modalSuccess ? 'Email updated' : 'Change email',
            body: modalSuccess ? (
              <p className="text-sm text-warm-600">{modalSuccess}</p>
            ) : (
              <div className="flex flex-col gap-3">
                <div>
                  <p className="text-xs text-warm-400 mb-1">Current email</p>
                  <p className="text-sm text-warm-600">{user?.email ?? 'None'}</p>
                </div>
                <div>
                  <label className="text-xs text-warm-400 block mb-1" htmlFor="new-email">
                    New email
                  </label>
                  <input
                    id="new-email"
                    type="email"
                    value={newEmail}
                    onChange={(e): void => setNewEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm text-warm-800 bg-surface-raised focus:outline-none focus:ring-2 focus:ring-profile-accent/50"
                  />
                </div>
                {modalError !== null && <p className="text-xs text-red-600">{modalError}</p>}
                <p className="text-xs text-warm-400">
                  We will send a confirmation link to your new email.
                </p>
              </div>
            ),
            confirmLabel: modalSuccess ? 'Done' : isSubmitting ? 'Sending...' : 'Update email',
            cancelLabel: 'Cancel',
          },
        ]}
      />

      {/* Password change modal */}
      <Modal
        isOpen={activeModal === 'password'}
        onClose={closeModal}
        onConfirm={modalSuccess ? closeModal : handlePasswordChange}
        confirmClassName="!bg-profile-accent hover:!bg-profile-accent-dark"
        steps={[
          {
            title: modalSuccess ? 'Password updated' : 'Change password',
            body: modalSuccess ? (
              <p className="text-sm text-warm-600">{modalSuccess}</p>
            ) : (
              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-xs text-warm-400 block mb-1" htmlFor="new-password">
                    New password
                  </label>
                  <input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e): void => setNewPassword(e.target.value)}
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
                    value={confirmPassword}
                    onChange={(e): void => setConfirmPassword(e.target.value)}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm text-warm-800 bg-surface-raised focus:outline-none focus:ring-2 focus:ring-profile-accent/50"
                  />
                </div>
                {modalError !== null && <p className="text-xs text-red-600">{modalError}</p>}
              </div>
            ),
            confirmLabel: modalSuccess ? 'Done' : isSubmitting ? 'Saving...' : 'Update password',
            cancelLabel: 'Cancel',
          },
        ]}
      />

      {/* Sign out confirmation modal */}
      <Modal
        isOpen={activeModal === 'signout'}
        onClose={closeModal}
        onConfirm={handleSignOut}
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
              {showPasswordOnDelete && (
                <div>
                  <label className="text-xs text-warm-400 block mb-1" htmlFor="delete-password">
                    Confirm your password
                  </label>
                  <input
                    id="delete-password"
                    type="password"
                    value={deletePassword}
                    onChange={(e): void => setDeletePassword(e.target.value)}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm text-warm-800 bg-surface-raised focus:outline-none focus:ring-2 focus:ring-red-300"
                  />
                </div>
              )}
              {deleteError !== null && <p className="text-xs text-red-600">{deleteError}</p>}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={closeModal}
                disabled={isDeleting}
                className="flex-1 rounded-xl px-4 py-2 text-sm font-medium text-text-secondary hover:bg-warm-100 transition-colors duration-150 min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={!canConfirmDelete || isDeleting}
                className="flex-1 rounded-xl px-4 py-2 text-sm font-medium text-white bg-red-800 hover:bg-red-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 min-h-[44px]"
              >
                {isDeleting ? 'Deleting...' : 'Delete my account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
