// ─────────────────────────────────────────────
// File: app/(main)/layout.tsx
// Purpose: Layout for main app screens. Renders the SettingsDialog
//          at layout level so it is available on every in-app page.
// Depends on: components/settings/settings-dialog.tsx
// ─────────────────────────────────────────────

import type { ReactNode } from 'react'
import { SettingsDialog } from '@/components/settings/settings-dialog'

export default function MainLayout({ children }: { children: ReactNode }): ReactNode {
  return (
    <>
      {children}
      <SettingsDialog />
    </>
  )
}
