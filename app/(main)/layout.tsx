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
import { SettingsDialog } from '@/components/settings/settings-dialog'
import { SessionPrefetch } from '@/components/performance/session-prefetch'

export default function MainLayout({ children }: { children: ReactNode }): ReactNode {
  return (
    <>
      <AppTopBar />
      {children}
      <SettingsDialog />
      <SessionPrefetch />
    </>
  )
}
