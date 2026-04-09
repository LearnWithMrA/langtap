// ─────────────────────────────────────────────
// File: app/page.tsx
// Purpose: Landing page. Public. No auth required. Server component.
//          LandingCta is a client island for the CTA buttons.
// Depends on: components/ui/landing-cta.tsx
// ─────────────────────────────────────────────

import type { ReactNode } from 'react'
import Link from 'next/link'
import { LandingCta } from '@/components/ui/landing-cta'

// ── Page ──────────────────────────────────────

export default function LandingPage(): ReactNode {
  return (
    <main className="min-h-screen bg-surface flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md flex flex-col items-center gap-8">
        {/* Hero */}
        <div className="flex flex-col items-center gap-3 text-center">
          <h1 className="text-4xl font-medium text-sage-500">LangTap</h1>
          <p className="text-base text-text-secondary leading-relaxed">
            A journey of a thousand miles begins with a single step... or a single push.
          </p>
        </div>

        {/* Cycling character animation placeholder
            The animation component is built in a later sprint once
            the asset is sourced. This space reserves the correct
            vertical rhythm in the layout. */}
        <div
          aria-hidden="true"
          className="w-40 h-40 rounded-2xl bg-warm-100 flex items-center justify-center"
        >
          <span className="text-4xl" role="img" aria-label="">
            🚴
          </span>
        </div>

        {/* Beginner note */}
        <p className="text-sm text-text-secondary text-center leading-relaxed">
          New to kana? We recommend spending an hour with{' '}
          <a
            href="https://www.tofugu.com/japanese/learn-hiragana/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-text-primary transition-colors duration-150"
          >
            Tofugu&apos;s free hiragana guide
          </a>{' '}
          before you start. Once you can recognise the characters, LangTap will help you type them
          without thinking.
        </p>

        {/* CTA buttons - client island */}
        <LandingCta />

        {/* Log in link */}
        <p className="text-sm text-text-muted">
          Already have an account?{' '}
          <Link
            href="/log-in"
            className="text-text-secondary underline hover:text-text-primary transition-colors duration-150"
          >
            Log in
          </Link>
        </p>
      </div>
    </main>
  )
}
