// ─────────────────────────────────────────────
// File: app/(main)/(scene)/demo/page.tsx
// Purpose: Bare /demo redirects to /demo/kana (default demo mode).
// Depends on: next/navigation
// ─────────────────────────────────────────────

import { redirect } from 'next/navigation'

export default function DemoPage(): never {
  redirect('/demo/kana')
}
