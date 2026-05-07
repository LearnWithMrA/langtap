// ─────────────────────────────────────────────
// File: app/(main)/layout.tsx
// Purpose: Layout for main app screens. Renders AppTopBar,
//          SettingsDialog, and SessionPrefetch at layout level
//          so they persist across all navigations within the
//          (main) route group. AppTopBar mounts once and stays
//          mounted, eliminating re-mount cost on every page
//          transition. SessionPrefetch warms core routes once
//          per browser session after a short delay.
// Depends on: components/layout/app-top-bar.tsx,
//             components/settings/settings-dialog.tsx,
//             components/performance/session-prefetch.tsx
// ─────────────────────────────────────────────

import type { ReactNode } from 'react'
import { AppTopBar } from '@/components/layout/app-top-bar'
import { GuestBanner } from '@/components/layout/guest-banner'
import { SettingsDialog } from '@/components/settings/settings-dialog'
import { SessionPrefetch } from '@/components/performance/session-prefetch'
import { PracticeDataPreloader } from '@/components/performance/practice-data-preloader'
import { StoreHydrator } from '@/components/performance/store-hydrator'
import { AuthInitializer } from '@/components/performance/auth-initializer'
import { AuthModalProvider } from '@/components/layout/auth-modal-provider'
import { ScrollRestoration } from '@/components/performance/scroll-restoration'
import { SyncManager } from '@/components/performance/sync-manager'
import { UsernameRepairModal } from '@/components/ui/username-repair-modal'

export default function MainLayout({ children }: { children: ReactNode }): ReactNode {
  return (
    <SyncManager>
      <AppTopBar />
      <GuestBanner />
      {children}
      <SettingsDialog />
      <AuthModalProvider />
      <AuthInitializer />
      <UsernameRepairModal />
      <StoreHydrator />
      <PracticeDataPreloader />
      <ScrollRestoration />
      <SessionPrefetch />
    </SyncManager>
  )
}
