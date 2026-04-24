// ─────────────────────────────────────────────
// File: components/profile/support-links.tsx
// Purpose: Profile page footer matching the landing page footer
//          layout. About/legal links, version number.
// Depends on: none
// ─────────────────────────────────────────────

import type { ReactNode } from 'react'

// ── Main export ───────────────────────────────

export function SupportLinks(): ReactNode {
  return (
    <footer className="bg-white/60 px-4 py-8 mt-auto">
      <div className="mx-auto max-w-2xl grid grid-cols-2 md:grid-cols-4 gap-6 text-sm text-warm-600">
        <div className="flex flex-col gap-2">
          <a href="#" className="hover:text-warm-800 transition-colors">
            Help and FAQ
          </a>
          <a href="/credits" className="hover:text-warm-800 transition-colors">
            Credits and attributions
          </a>
        </div>
        <div className="flex flex-col gap-2">
          <a href="#" className="hover:text-warm-800 transition-colors">
            Privacy Policy
          </a>
          <a href="#" className="hover:text-warm-800 transition-colors">
            Terms of Service
          </a>
        </div>
      </div>
      <div className="mt-6 text-center text-xs text-warm-300">LangTap v1.0</div>
    </footer>
  )
}
