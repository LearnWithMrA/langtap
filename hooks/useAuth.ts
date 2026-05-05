// ------------------------------------------------------------
// File: hooks/useAuth.ts
// Purpose: Pure Zustand selector for auth state. Reads user,
//          profile, and loading state from useUserStore. Derives
//          isAuthenticated, isGuest, isAnonymous. No useEffect,
//          no Supabase calls, no subscriptions. Auth initialization
//          lives in AuthInitializer (mounted once per layout).
// Depends on: stores/user.store.ts
// ------------------------------------------------------------

import { useUserStore } from '@/stores/user.store'
import type { AuthUser, UserProfile } from '@/types/user.types'

// ── Hook ──────────────────────────────────────

export function useAuth(): {
  user: AuthUser | null
  profile: UserProfile | null
  isLoading: boolean
  isAuthenticated: boolean
  isGuest: boolean
  isAnonymous: boolean
} {
  const user = useUserStore((s) => s.user)
  const profile = useUserStore((s) => s.profile)
  const isLoading = useUserStore((s) => s.isLoading)
  const isAnonymous = user?.isAnonymous ?? false

  return {
    user,
    profile,
    isLoading,
    isAuthenticated: user !== null && !isAnonymous,
    isGuest: (user === null || isAnonymous) && !isLoading,
    isAnonymous,
  }
}
