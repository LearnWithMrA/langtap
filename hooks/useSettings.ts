// ─────────────────────────────────────────────
// File: hooks/useSettings.ts
// Purpose: Syncs profile settings from Supabase to the settings
//          store on login. Re-runs when the user changes (not
//          one-shot). For signed-in users, reads input_mode from
//          the loaded profile and pushes to the settings store.
//          Guests use localStorage-only (no sync).
// Depends on: stores/settings.store.ts, stores/user.store.ts,
//             hooks/useAuth.ts
// ─────────────────────────────────────────────

'use client'

import { useEffect, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useUserStore } from '@/stores/user.store'
import { useSettingsStore } from '@/stores/settings.store'
import type { InputMode } from '@/types/settings.types'

const VALID_INPUT_MODES: readonly InputMode[] = ['tap', 'type', 'swipe']

export function useSettingsSync(): void {
  const { isAuthenticated, isGuest, profile } = useAuth()
  const isProfileLoaded = useUserStore((s) => s.isProfileLoaded)
  const lastSyncedUserIdRef = useRef<string | null>(null)
  const userId = useUserStore((s) => s.user?.id ?? null)

  useEffect(() => {
    if (!isAuthenticated || isGuest || !isProfileLoaded || !profile) return
    if (lastSyncedUserIdRef.current === userId) return
    lastSyncedUserIdRef.current = userId

    const profileMode = profile.inputMode
    if (VALID_INPUT_MODES.includes(profileMode)) {
      useSettingsStore.getState().setInputMode(profileMode)
    }
  }, [isAuthenticated, isGuest, isProfileLoaded, profile, userId])
}
