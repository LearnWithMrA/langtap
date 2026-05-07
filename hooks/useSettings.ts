// ─────────────────────────────────────────────
// File: hooks/useSettings.ts
// Purpose: Syncs profile settings from Supabase to the settings
//          store on login. For signed-in users, reads input_mode
//          from the loaded profile and pushes it to the settings
//          store so the user's onboarding choice persists across
//          devices. Guests use localStorage-only (no sync).
//          Full bidirectional sync (store -> profile on change)
//          is implemented in Phase 4 (Connect Profile to Supabase).
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
  const syncedRef = useRef(false)

  useEffect(() => {
    if (!isAuthenticated || isGuest || !isProfileLoaded || !profile) return
    if (syncedRef.current) return
    syncedRef.current = true

    const profileMode = profile.inputMode
    if (VALID_INPUT_MODES.includes(profileMode)) {
      useSettingsStore.getState().setInputMode(profileMode)
    }
  }, [isAuthenticated, isGuest, isProfileLoaded, profile])
}
