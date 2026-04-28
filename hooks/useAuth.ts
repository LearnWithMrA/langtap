// ------------------------------------------------------------
// File: hooks/useAuth.ts
// Purpose: Exposes current user and authentication state to components.
//          Initialises auth on mount, subscribes to auth state changes.
//          Components use this to check if authenticated or guest mode.
//          Never calls Supabase directly for data; goes through services.
// Depends on: stores/user.store.ts, services/auth.service.ts,
//             services/supabase-browser.ts, services/profile.service.ts
// ------------------------------------------------------------

'use client'

import { useEffect } from 'react'
import { createBrowserSupabaseClient } from '@/services/supabase-browser'
import { getUser } from '@/services/auth.service'
import { loadProfile } from '@/services/profile.service'
import { useUserStore } from '@/stores/user.store'
import type { AuthUser, UserProfile } from '@/types/user.types'

// ── Hook ──────────────────────────────────────

export function useAuth(): {
  user: AuthUser | null
  profile: UserProfile | null
  isLoading: boolean
  isAuthenticated: boolean
  isGuest: boolean
} {
  const user = useUserStore((s) => s.user)
  const profile = useUserStore((s) => s.profile)
  const isLoading = useUserStore((s) => s.isLoading)

  useEffect(() => {
    let mounted = true

    async function init(): Promise<void> {
      const { user: authUser } = await getUser()

      if (!mounted) return

      if (authUser) {
        useUserStore.getState().setUser(authUser)
        const profileResult = await loadProfile(authUser.id)
        if (!mounted) return
        if (profileResult.ok) {
          useUserStore.getState().setProfile(profileResult.data)
        }
      } else {
        useUserStore.getState().clear()
      }

      useUserStore.getState().setLoading(false)
    }

    init()

    const supabase = createBrowserSupabaseClient()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return

      if (session?.user) {
        const authUser = { id: session.user.id, email: session.user.email }
        useUserStore.getState().setUser(authUser)
        loadProfile(session.user.id).then((result) => {
          if (!mounted) return
          if (result.ok) {
            useUserStore.getState().setProfile(result.data)
          }
        })
      } else {
        useUserStore.getState().clear()
      }
    })

    return (): void => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  return {
    user,
    profile,
    isLoading,
    isAuthenticated: user !== null,
    isGuest: user === null && !isLoading,
  }
}
