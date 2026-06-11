// ------------------------------------------------------------
// File: components/layout/legal-page-shell.tsx
// Purpose: Shared layout for legal pages (terms, privacy, acceptable
//          use, copyright). Top bar with logo back to the landing page
//          (middleware sends signed-in users to /home), page title and
//          last-updated date, then the document inside an official
//          contract-style panel that scrolls internally, and the
//          landing footer. Server component - no client state.
// Depends on: components/ui/logo-full.tsx,
//             components/layout/landing-footer.tsx
// ------------------------------------------------------------

import type { ReactNode } from 'react'
import Link from 'next/link'
import { LogoFull } from '@/components/ui/logo-full'
import { LandingFooter } from '@/components/layout/landing-footer'

// -- Types ----------------------------------------------------

type LegalPageShellProps = {
  title: string
  lastUpdated: string
  intro?: ReactNode
  children: ReactNode
}

// -- Component ------------------------------------------------

// Sticky top bar shared by all static/legal pages (terms, privacy,
// acceptable use, copyright, credits). Logo and button both lead to the
// landing page; middleware sends signed-in users on to /home.
export function LegalTopBar(): ReactNode {
  return (
    <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-sm border-b border-warm-100">
      <nav
        className="mx-auto max-w-5xl flex items-center justify-between px-4 sm:px-8 h-16"
        aria-label="Legal pages navigation"
      >
        <Link href="/" aria-label="Back to LangTap home" className="flex items-center">
          <LogoFull className="h-8 w-auto" />
        </Link>
        <Link
          href="/"
          className="min-h-11 inline-flex items-center text-sm font-medium text-sage-600 hover:text-sage-500 transition-colors px-3"
          aria-label="Back to LangTap"
        >
          Back to LangTap
        </Link>
      </nav>
    </header>
  )
}

export function LegalPageShell({
  title,
  lastUpdated,
  intro,
  children,
}: LegalPageShellProps): ReactNode {
  return (
    <div className="min-h-svh bg-warm-50 flex flex-col">
      <LegalTopBar />

      <main className="mx-auto max-w-3xl px-4 sm:px-8 pt-10 pb-16 flex-1 w-full">
        <h1 className="text-2xl font-bold text-warm-800 mb-1">{title}</h1>
        <p className="text-xs text-warm-400 mb-4">Last updated: {lastUpdated}</p>
        {intro && <div className="text-sm text-warm-600 mb-6">{intro}</div>}

        {/* Official document panel: the full text scrolls inside this
            bordered, paper-styled container rather than the page. */}
        <div
          className="bg-white border border-warm-200 rounded-lg shadow-[0_2px_12px_rgba(61,48,40,0.08)] max-h-[70vh] overflow-y-auto px-6 sm:px-10 py-8"
          role="region"
          aria-label={`${title} document`}
          tabIndex={0}
        >
          <div className="space-y-6 text-sm text-warm-700 leading-relaxed [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-warm-800 [&_h2]:mt-2 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-warm-800 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_table]:w-full [&_table]:text-left [&_th]:font-semibold [&_th]:text-warm-800 [&_th]:pb-2 [&_td]:py-1.5 [&_td]:pr-4 [&_td]:align-top [&_a]:text-sage-600 [&_a]:underline">
            {children}
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  )
}
