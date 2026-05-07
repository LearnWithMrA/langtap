// ─────────────────────────────────────────────
// File: components/performance/auth-initializer.tsx
// Purpose: Single auth initialization point for the app. Mounts
//          once in (main) and (onboarding) layouts (not root, so
//          landing page is unaffected). Calls getUser() once, sets
//          auth identity immediately, then loads profile as a
//          non-blocking background operation. Sets up one
//          onAuthStateChange subscription.
//          After profile loads for permanent users, runs the
//          guest-to-account migration check (Plan 5): detects
//          guest keys, legacy keys, or pending imports, and
//          routes to auto-import, confirmation prompt, or retry.
//          Sets migrationPhaseComplete when the decision resolves.
// Depends on: services/auth.service.ts, services/profile.service.ts,
//             services/guest-import.service.ts, services/import-snapshot.ts,
//             services/supabase-browser.ts, stores/user.store.ts,
//             stores/scoped-storage.ts
// ─────────────────────────────────────────────

'use client'

import { useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import { createBrowserSupabaseClient } from '@/services/supabase-browser'
import { getUser } from '@/services/auth.service'
import { loadProfile } from '@/services/profile.service'
import { importGuestProgress, importLegacyProgress } from '@/services/guest-import.service'
import { buildImportPayload, extractGuestSessionId } from '@/services/import-snapshot'
import { useUserStore } from '@/stores/user.store'
import type { UserProfile } from '@/types/user.types'
import {
  setStorageUserId,
  resetStoresForAuthChange,
  hasGuestKeys,
  readGuestKeys,
  deleteGuestKeys,
  hasLegacyGlobalKeys,
  readLegacyGlobalKeys,
  deleteLegacyGlobalKeys,
  hasPendingGuestImport,
  clearPendingGuestImport,
  setPendingGuestImport,
  getGuestSessionMarker,
  clearGuestSessionMarker,
} from '@/stores/scoped-storage'
import type { ImportResult } from '@/services/guest-import.service'
import { ImportPromptModal } from '@/components/ui/import-prompt-modal'
import { PendingImportBanner } from '@/components/ui/pending-import-banner'

// ── Helpers ─────────────────────────────────────

function isClassifiedResponse(result: ImportResult): boolean {
  if (result.ok) return true
  return result.status !== 'error'
}

async function detectOAuthProvider(): Promise<boolean> {
  const supabase = createBrowserSupabaseClient()
  const { data } = await supabase.auth.getUser()
  const provider = data.user?.app_metadata?.provider
  return typeof provider === 'string' && provider !== 'email'
}

function checkLegacyAndComplete(profile: UserProfile): void {
  const store = useUserStore.getState()
  const legacyDecisionMade =
    profile.legacyImportedAt !== null || profile.legacyImportSkippedAt !== null
  if (!legacyDecisionMade && hasLegacyGlobalKeys()) {
    store.setShowLegacyImportPrompt(true)
    return
  }
  store.setMigrationPhaseComplete(true)
}

// ── Migration logic ─────────────────────────────

async function runGuestMigrationCheck(userId: string, profile: UserProfile): Promise<void> {
  const store = useUserStore.getState()

  const guestDecisionMade =
    profile.guestImportedAt !== null || profile.guestImportSkippedAt !== null

  // Check for pending import from a previous failed attempt.
  // Stores remain on guest keys (setStorageUserId stays null).
  if (!guestDecisionMade && hasPendingGuestImport(userId) && hasGuestKeys()) {
    store.setPendingGuestImport(true)
    return
  }

  // Check for current-session guest keys
  if (!guestDecisionMade && hasGuestKeys()) {
    const sessionMarker = getGuestSessionMarker()
    const rawKeys = readGuestKeys()
    const snapshotMarker = extractGuestSessionId(rawKeys)
    const markersMatch =
      sessionMarker !== null && snapshotMarker !== null && sessionMarker === snapshotMarker
    const isOAuth = await detectOAuthProvider()

    if (markersMatch && !isOAuth) {
      await handleGuestAutoImport(userId, profile)
      return
    }

    store.setShowGuestImportPrompt(true)
    return
  }

  checkLegacyAndComplete(profile)
}

async function handleGuestAutoImport(userId: string, profile: UserProfile): Promise<void> {
  const store = useUserStore.getState()
  const rawKeys = readGuestKeys()
  const payload = buildImportPayload(rawKeys)
  const result = await importGuestProgress(payload)

  if (isClassifiedResponse(result)) {
    deleteGuestKeys()
    clearGuestSessionMarker()
    setStorageUserId(userId)
    resetStoresForAuthChange()
    checkLegacyAndComplete(profile)
  } else {
    // Transient error: stay on guest keys, set pending flag
    setPendingGuestImport(userId)
    clearGuestSessionMarker()
    store.setPendingGuestImport(true)
  }
}

// ── Main export ─────────────────────────────────

export function AuthInitializer(): ReactNode {
  const showGuestPrompt = useUserStore((s) => s.showGuestImportPrompt)
  const showLegacyPrompt = useUserStore((s) => s.showLegacyImportPrompt)

  useEffect(() => {
    let mounted = true
    let activeUserId: string | null = null

    async function init(): Promise<void> {
      const { user: authUser } = await getUser()

      if (!mounted) return

      if (authUser) {
        activeUserId = authUser.id
        const isAnon = authUser.isAnonymous ?? false
        setStorageUserId(isAnon ? null : authUser.id)
        useUserStore.getState().setUser({
          ...authUser,
          isAnonymous: isAnon,
        })
      } else {
        activeUserId = null
        setStorageUserId(null)
        useUserStore.getState().clear()
      }

      useUserStore.getState().setLoading(false)

      if (authUser) {
        const profileResult = await loadProfile(authUser.id)
        if (!mounted || activeUserId !== authUser.id) return

        if (profileResult.ok) {
          useUserStore.getState().setProfile(profileResult.data)
        } else {
          useUserStore.getState().setProfileLoaded(true)
        }

        const isAnon = authUser.isAnonymous ?? false
        if (!isAnon && profileResult.ok) {
          // For permanent users with pending import, keep stores on guest keys
          if (hasPendingGuestImport(authUser.id) && hasGuestKeys()) {
            setStorageUserId(null)
          }
          await runGuestMigrationCheck(authUser.id, profileResult.data)
        } else {
          useUserStore.getState().setMigrationPhaseComplete(true)
        }
      } else {
        useUserStore.getState().setMigrationPhaseComplete(true)
      }
    }

    init()

    const supabase = createBrowserSupabaseClient()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return

      if (session?.user) {
        const userId = session.user.id
        const isAnon = session.user.is_anonymous ?? false
        activeUserId = userId
        setStorageUserId(isAnon ? null : userId)
        resetStoresForAuthChange()
        useUserStore.getState().setProfile(null)
        useUserStore.getState().setMigrationPhaseComplete(false)
        useUserStore.getState().setPendingGuestImport(false)
        useUserStore.getState().setShowGuestImportPrompt(false)
        useUserStore.getState().setShowLegacyImportPrompt(false)
        useUserStore.getState().setServerHydrated(false)
        useUserStore.getState().setUser({
          id: userId,
          email: session.user.email,
          isAnonymous: isAnon,
        })
        loadProfile(userId).then((result) => {
          if (!mounted || activeUserId !== userId) return
          if (result.ok) {
            useUserStore.getState().setProfile(result.data)
          } else {
            useUserStore.getState().setProfileLoaded(true)
          }

          if (!isAnon && result.ok) {
            if (hasPendingGuestImport(userId) && hasGuestKeys()) {
              setStorageUserId(null)
            }
            runGuestMigrationCheck(userId, result.data)
          } else {
            useUserStore.getState().setMigrationPhaseComplete(true)
          }
        })
      } else {
        activeUserId = null
        setStorageUserId(null)
        resetStoresForAuthChange()
        useUserStore.getState().clear()
        useUserStore.getState().setMigrationPhaseComplete(true)
      }
    })

    return (): void => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  // ── Import prompt handlers ──────────────────

  const handleGuestImport = useCallback(async (): Promise<void> => {
    const userId = useUserStore.getState().user?.id
    const profile = useUserStore.getState().profile
    if (!userId || !profile) return

    const rawKeys = readGuestKeys()
    const payload = buildImportPayload(rawKeys)
    const result = await importGuestProgress(payload)

    if (isClassifiedResponse(result)) {
      deleteGuestKeys()
      clearGuestSessionMarker()
      setStorageUserId(userId)
      resetStoresForAuthChange()
      useUserStore.getState().setShowGuestImportPrompt(false)
      checkLegacyAndComplete(profile)
    } else {
      throw new Error('Import failed')
    }
  }, [])

  const handleGuestSkip = useCallback(async (): Promise<void> => {
    const userId = useUserStore.getState().user?.id
    const profile = useUserStore.getState().profile
    if (!userId || !profile) return

    const supabase = createBrowserSupabaseClient()
    const { data, error } = await supabase.rpc('skip_guest_import')

    if (error) throw new Error('Skip failed')

    const d = data as Record<string, unknown> | null
    if (d && d['ok'] === true) {
      deleteGuestKeys()
      clearGuestSessionMarker()
      setStorageUserId(userId)
      resetStoresForAuthChange()
      useUserStore.getState().setShowGuestImportPrompt(false)
      checkLegacyAndComplete(profile)
    } else {
      throw new Error('Skip failed')
    }
  }, [])

  const handleLegacyImport = useCallback(async (): Promise<void> => {
    const rawKeys = readLegacyGlobalKeys()
    const payload = buildImportPayload(rawKeys)
    const result = await importLegacyProgress(payload)

    if (isClassifiedResponse(result)) {
      deleteLegacyGlobalKeys()
      useUserStore.getState().setShowLegacyImportPrompt(false)
      useUserStore.getState().setMigrationPhaseComplete(true)
    } else {
      throw new Error('Import failed')
    }
  }, [])

  const handleLegacySkip = useCallback(async (): Promise<void> => {
    const supabase = createBrowserSupabaseClient()
    const { data, error } = await supabase.rpc('skip_legacy_import')

    if (error) throw new Error('Skip failed')

    const d = data as Record<string, unknown> | null
    if (d && d['ok'] === true) {
      deleteLegacyGlobalKeys()
      useUserStore.getState().setShowLegacyImportPrompt(false)
      useUserStore.getState().setMigrationPhaseComplete(true)
    } else {
      throw new Error('Skip failed')
    }
  }, [])

  const handlePendingRetry = useCallback(async (): Promise<void> => {
    const userId = useUserStore.getState().user?.id
    const profile = useUserStore.getState().profile
    if (!userId || !profile) return

    const rawKeys = readGuestKeys()
    const payload = buildImportPayload(rawKeys)
    const result = await importGuestProgress(payload)

    if (isClassifiedResponse(result)) {
      deleteGuestKeys()
      clearPendingGuestImport(userId)
      setStorageUserId(userId)
      resetStoresForAuthChange()
      useUserStore.getState().setPendingGuestImport(false)
      checkLegacyAndComplete(profile)
    } else {
      throw new Error('Retry failed')
    }
  }, [])

  const handleStartFresh = useCallback(async (): Promise<void> => {
    const userId = useUserStore.getState().user?.id
    const profile = useUserStore.getState().profile
    if (!userId || !profile) return

    const supabase = createBrowserSupabaseClient()
    const { data, error } = await supabase.rpc('skip_guest_import')

    if (error) throw new Error('Start fresh failed')

    const d = data as Record<string, unknown> | null
    if (d && d['ok'] === true) {
      deleteGuestKeys()
      clearPendingGuestImport(userId)
      setStorageUserId(userId)
      resetStoresForAuthChange()
      useUserStore.getState().setPendingGuestImport(false)
      checkLegacyAndComplete(profile)
    } else {
      throw new Error('Start fresh failed')
    }
  }, [])

  return (
    <>
      <ImportPromptModal
        isOpen={showGuestPrompt}
        variant="guest"
        onImport={handleGuestImport}
        onSkip={handleGuestSkip}
      />
      <ImportPromptModal
        isOpen={showLegacyPrompt}
        variant="legacy"
        onImport={handleLegacyImport}
        onSkip={handleLegacySkip}
      />
      <PendingImportBanner onRetry={handlePendingRetry} onStartFresh={handleStartFresh} />
    </>
  )
}
