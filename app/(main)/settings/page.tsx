// ─────────────────────────────────────────────
// File: app/(main)/settings/page.tsx
// Purpose: Settings is now a dialog overlay (not a route).
//          This page redirects to /home. The settings dialog is
//          triggered from the gear icon in the top bar.
// Depends on: next/navigation
// ─────────────────────────────────────────────

import { redirect } from 'next/navigation'

export default function SettingsPage(): never {
  redirect('/home')
}
