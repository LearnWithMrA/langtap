// ─────────────────────────────────────────────
// File: app/(main)/credits/page.tsx
// Purpose: Credits and attribution screen. Lists all third-party
//          content licences: JMDict, VOICEVOX, lo-fi music, fonts.
// Depends on: components/layout/landing-footer.tsx
// ─────────────────────────────────────────────

import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { LandingFooter } from '@/components/layout/landing-footer'
import { LegalTopBar } from '@/components/layout/legal-page-shell'

export const metadata: Metadata = {
  title: 'Credits - LangTap',
}

function CreditEntry({
  title,
  description,
  licence,
  url,
}: {
  title: string
  description: string
  licence: string
  url?: string
}): ReactNode {
  return (
    <div className="bg-surface-raised rounded-xl border border-border p-4">
      <h3 className="text-sm font-semibold text-warm-800">{title}</h3>
      <p className="text-sm text-warm-600 mt-1">{description}</p>
      <p className="text-xs text-warm-400 mt-2">Licence: {licence}</p>
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-sage-600 hover:text-sage-700 underline mt-1 inline-block"
        >
          {url}
        </a>
      )}
    </div>
  )
}

export default function CreditsPage(): ReactNode {
  return (
    <div className="min-h-svh bg-warm-50 flex flex-col">
      <LegalTopBar />
      <main className="max-w-2xl mx-auto px-4 sm:px-8 pt-10 pb-16 flex-1 w-full">
        <h1 className="text-2xl font-bold text-warm-800 mb-2">Credits</h1>
        <p className="text-sm text-warm-600 mb-8">
          LangTap is built with open-source tools and freely licensed content. Thank you to the
          creators and communities behind these projects.
        </p>

        <div className="space-y-4">
          <CreditEntry
            title="JMDict / EDRDG"
            description="Word bank data (vocabulary definitions, readings, and JLPT level classifications) is derived from the JMDict dictionary project maintained by the Electronic Dictionary Research and Development Group."
            licence="Creative Commons Attribution-ShareAlike 4.0"
            url="https://www.edrdg.org/wiki/index.php/JMdict-EDICT_Dictionary_Project"
          />

          <CreditEntry
            title="VOICEVOX"
            description="Word pronunciation audio is generated using VOICEVOX, an open-source Japanese text-to-speech engine. Audio is pre-generated offline, not at runtime."
            licence="VOICEVOX terms (attribution required for non-commercial use)"
            url="https://voicevox.hiroshiba.jp"
          />

          <CreditEntry
            title="Lo-fi Background Music"
            description="Background music tracks by HoliznaCC0. Tracks: Bubbles, Peaceful Drift, Going Home, Warm Fuzz, Spring Cleaning, Learning."
            licence="CC0 (Public Domain)"
            url="https://freemusicarchive.org/music/holiznacc0"
          />

          <CreditEntry
            title="Noto Sans JP"
            description="Default Japanese font used throughout the app."
            licence="SIL Open Font Licence 1.1"
            url="https://fonts.google.com/noto/specimen/Noto+Sans+JP"
          />

          <CreditEntry
            title="Next.js"
            description="Web framework powering the application."
            licence="MIT Licence"
            url="https://nextjs.org"
          />

          <CreditEntry
            title="Supabase"
            description="Authentication, database, and backend services."
            licence="Apache 2.0"
            url="https://supabase.com"
          />
        </div>
      </main>
      <LandingFooter />
    </div>
  )
}
