// ─────────────────────────────────────────────
// File: components/performance/auth-initializer.tsx
// Purpose: Single auth initialization point for the app. Mounts
//          once in (main) and (onboarding) layouts (not root, so
//          landing page is unaffected). Calls getUser() once, sets
//          auth identity immediately, then loads profile as a
//          non-blocking background operation. Sets up one
//          onAuthStateChange subscription.
// Depends on: services/auth.service.ts, services/profile.service.ts,
//             services/supabase-browser.ts, stores/user.store.ts,
//             stores/scoped-storage.ts
// ─────────────────────────────────────────────

'use client'

import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { createBrowserSupabaseClient } from '@/services/supabase-browser'
import { getUser } from '@/services/auth.service'
import { loadProfile } from '@/services/profile.service'
import { useUserStore } from '@/stores/user.store'
import { useSettingsStore } from '@/stores/settings.store'
import { useDailyCapStore } from '@/stores/daily-cap.store'
import {
  setStorageUserId,
  resetStoresForAuthChange,
  sweepObsoleteStorage,
} from '@/stores/scoped-storage'

// ── Main export ─────────────────────────────────

export function AuthInitializer(): ReactNode {
  useEffect(() => {
    // One-time housekeeping: remove localStorage keys from retired features.
    sweepObsoleteStorage()

    let mounted = true
    let activeUserId: string | null = null

    async function init(): Promise<void> {
      const { user: authUser } = await getUser()

      if (!mounted) return

      if (authUser) {
        activeUserId = authUser.id
        setStorageUserId(authUser.id)
        useUserStore.getState().setUser(authUser)
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
          useSettingsStore.getState().hydrateFromProfile(profileResult.data)
        } else {
          useUserStore.getState().setProfileLoaded(true)
        }
      }

      useUserStore.getState().setMigrationPhaseComplete(true)
    }

    init()

    const supabase = createBrowserSupabaseClient()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return

      if (session?.user && !session.user.is_anonymous) {
        const userId = session.user.id

        // Same user (token refresh): skip full reset to avoid breaking hydration
        if (userId === activeUserId) return

        activeUserId = userId
        setStorageUserId(userId)
        resetStoresForAuthChange()
        useDailyCapStore.getState().reset()
        useUserStore.getState().setProfile(null)
        useUserStore.getState().setMigrationPhaseComplete(false)
        useUserStore.getState().setServerHydrated(false)
        useUserStore.getState().setUser({
          id: userId,
          email: session.user.email,
          isAnonymous: false,
        })
        loadProfile(userId).then((result) => {
          if (!mounted || activeUserId !== userId) return
          if (result.ok) {
            useUserStore.getState().setProfile(result.data)
            useSettingsStore.getState().hydrateFromProfile(result.data)
          } else {
            useUserStore.getState().setProfileLoaded(true)
          }
          useUserStore.getState().setMigrationPhaseComplete(true)
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

  return null
}
