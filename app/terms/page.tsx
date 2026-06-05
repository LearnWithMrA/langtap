// ─────────────────────────────────────────────
// File: app/(main)/terms/page.tsx
// Purpose: Terms of service page. Plain language. Covers acceptable
//          use, account responsibility, and limitation of liability.
// Depends on: components/layout/landing-footer.tsx
// ─────────────────────────────────────────────

import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { LandingFooter } from '@/components/layout/landing-footer'

export const metadata: Metadata = {
  title: 'Terms of Service - LangTap',
}

export default function TermsPage(): ReactNode {
  return (
    <div className="min-h-svh bg-warm-50 flex flex-col">
      <main className="max-w-2xl mx-auto px-4 sm:px-8 pt-20 pb-16 flex-1 w-full">
        <h1 className="text-2xl font-bold text-warm-800 mb-6">Terms of Service</h1>
        <p className="text-xs text-warm-400 mb-8">Last updated: 8 May 2026</p>

        <div className="space-y-6 text-sm text-warm-700 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-warm-800 mb-2">What you are agreeing to</h2>
            <p>
              By using LangTap you agree to these terms. If you do not agree, do not use the app.
              LangTap is a typing practice tool, not a language course. We make no guarantees about
              learning outcomes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-warm-800 mb-2">Your account</h2>
            <p>
              You are responsible for keeping your password secure. Do not share your account. Your
              username is visible on the leaderboard. Do not use your real name as your username. We
              may remove accounts or usernames that are offensive or misleading.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-warm-800 mb-2">Acceptable use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Attempt to access other users' accounts or data</li>
              <li>Submit false or manipulated practice data to the leaderboard</li>
              <li>Use automated tools or scripts to interact with the app</li>
              <li>Reverse-engineer, decompile, or extract the source code</li>
              <li>Use the app for any unlawful purpose</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-warm-800 mb-2">Demo mode</h2>
            <p>
              The demo lets you try LangTap without an account. Demo progress is not saved. Create
              an account to save your progress and access the full app.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-warm-800 mb-2">Content and attribution</h2>
            <p>
              LangTap uses third-party content under open licences. See the{' '}
              <a href="/credits" className="text-sage-600 hover:text-sage-700 underline">
                Credits
              </a>{' '}
              page for full attribution. You may not redistribute the app's content separately.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-warm-800 mb-2">Availability</h2>
            <p>
              We aim to keep LangTap available but do not guarantee uninterrupted access. We may
              change, suspend, or discontinue features at any time. Maintenance or updates may cause
              temporary downtime.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-warm-800 mb-2">Limitation of liability</h2>
            <p>
              LangTap is provided as-is. We are not liable for any loss of data, progress, or
              practice streaks due to service interruptions, bugs, or account deletion. Our total
              liability is limited to the amount you have paid us (which is zero for free-tier
              users).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-warm-800 mb-2">Account deletion</h2>
            <p>
              You can delete your account at any time from the Profile screen. Deletion is permanent
              and removes all your data. We may also delete inactive accounts after 12 months of no
              activity, with prior email notice.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-warm-800 mb-2">Changes to these terms</h2>
            <p>
              We may update these terms. Continued use after changes constitutes acceptance. The
              date at the top shows when these terms were last updated.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-warm-800 mb-2">Contact</h2>
            <p>
              Questions about these terms? Email{' '}
              <a
                href="mailto:hello@langtap.com"
                className="text-sage-600 hover:text-sage-700 underline"
              >
                hello@langtap.com
              </a>
              .
            </p>
          </section>
        </div>
      </main>
      <LandingFooter />
    </div>
  )
}
