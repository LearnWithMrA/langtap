// ─────────────────────────────────────────────
// File: components/performance/auth-initializer.tsx
// Purpose: Single auth initialization point for the app. Mounts
//          once in (main) and (onboarding) layouts (not root, so
//          landing page is unaffected). Calls getUser() once, sets
//          auth identity immediately, then loads profile as a
//          non-blocking background operation. Sets up one
//          onAuthStateChange subscription. All useAuth consumers
//          read from the store without making their own Supabase
//          calls. Profile writes are guarded by user ID to prevent
//          stale responses from overwriting newer auth state.
// Depends on: services/auth.service.ts, services/profile.service.ts,
//             services/supabase-browser.ts, stores/user.store.ts
// ─────────────────────────────────────────────

'use client'

import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { createBrowserSupabaseClient } from '@/services/supabase-browser'
import { getUser } from '@/services/auth.service'
import { loadProfile } from '@/services/profile.service'
import { useUserStore } from '@/stores/user.store'
import { setStorageUserId } from '@/stores/scoped-storage'

// ── Main export ───────────────────────────────

export function AuthInitializer(): ReactNode {
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
        if (mounted && activeUserId === authUser.id) {
          if (profileResult.ok) {
            useUserStore.getState().setProfile(profileResult.data)
          } else {
            useUserStore.getState().setProfileLoaded(true)
          }
        }
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
        useUserStore.getState().setProfile(null)
        useUserStore.getState().setUser({
          id: userId,
          email: session.user.email,
          isAnonymous: isAnon,
        })
        loadProfile(userId).then((result) => {
          if (!mounted) return
          if (activeUserId === userId) {
            if (result.ok) {
              useUserStore.getState().setProfile(result.data)
            } else {
              useUserStore.getState().setProfileLoaded(true)
            }
          }
        })
      } else {
        activeUserId = null
        setStorageUserId(null)
        useUserStore.getState().clear()
      }
    })

    return (): void => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  return null
}
