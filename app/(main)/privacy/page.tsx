// ─────────────────────────────────────────────
// File: app/(main)/privacy/page.tsx
// Purpose: Privacy policy page. Plain language. Covers data storage,
//          leaderboard visibility, guest mode, email, and cookies.
// Depends on: components/layout/landing-footer.tsx
// ─────────────────────────────────────────────

import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { LandingFooter } from '@/components/layout/landing-footer'

export const metadata: Metadata = {
  title: 'Privacy Policy - LangTap',
}

export default function PrivacyPage(): ReactNode {
  return (
    <div className="min-h-svh bg-warm-50 flex flex-col">
      <main className="max-w-2xl mx-auto px-4 sm:px-8 pt-20 pb-16 flex-1 w-full">
        <h1 className="text-2xl font-bold text-warm-800 mb-6">Privacy Policy</h1>
        <p className="text-xs text-warm-400 mb-8">Last updated: 8 May 2026</p>

        <div className="space-y-6 text-sm text-warm-700 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-warm-800 mb-2">What LangTap is</h2>
            <p>
              LangTap is a web-based Japanese typing fluency app. It helps you build speed and
              comfort typing Japanese characters. It is not a language teaching app.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-warm-800 mb-2">What we collect</h2>
            <p>We store only what is necessary to run the app:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>
                <strong>Username</strong> (chosen by you, not your real name)
              </li>
              <li>
                <strong>Email address</strong> (for sign-in only, stored by our auth provider)
              </li>
              <li>
                <strong>JLPT level and input mode preferences</strong>
              </li>
              <li>
                <strong>Practice scores</strong> (mastery scores, word counters, distance travelled)
              </li>
              <li>
                <strong>Settings</strong> (toggles like audio, hints, distance unit)
              </li>
            </ul>
            <p className="mt-2">
              We do not collect real names, profile photos, location data, or device fingerprints.
              We do not sell or share your data with third parties.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-warm-800 mb-2">Leaderboard</h2>
            <p>
              Your username appears on the public leaderboard by default. You can hide yourself from
              the leaderboard in Settings. Even when hidden, your scores are still tracked for your
              own progress. Choose a username that is not your real name.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-warm-800 mb-2">Guest mode</h2>
            <p>
              You can use LangTap without creating an account. Guest progress is stored in your
              browser (localStorage) and is not sent to our servers. If you clear your browser data,
              guest progress is lost. Guest mode has a 30-metre practice cap.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-warm-800 mb-2">Cookies</h2>
            <p>
              LangTap uses HTTP-only session cookies to keep you signed in. These are managed by our
              auth provider (Supabase) and are not used for tracking or advertising. Guest mode uses
              localStorage, not cookies.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-warm-800 mb-2">Where your data is stored</h2>
            <p>
              Account data is stored in a Supabase-hosted PostgreSQL database. Authentication is
              handled by Supabase Auth. The app is hosted on Vercel. All data is transmitted over
              HTTPS.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-warm-800 mb-2">Email</h2>
            <p>
              We use your email address for sign-in only. We do not send marketing emails. If we add
              practice reminders in the future, they will be opt-in with a clear unsubscribe option.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-warm-800 mb-2">Deleting your account</h2>
            <p>
              You can permanently delete your account from the Profile screen. This removes all your
              data from our servers, including scores, settings, and your email address. This cannot
              be undone.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-warm-800 mb-2">Children</h2>
            <p>
              LangTap is not directed at children under 13. We do not knowingly collect data from
              children under 13. If you believe a child has provided us with data, please contact us
              and we will delete it.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-warm-800 mb-2">Contact</h2>
            <p>
              If you have questions about this policy or your data, email{' '}
              <a
                href="mailto:privacy@langtap.com"
                className="text-sage-600 hover:text-sage-700 underline"
              >
                privacy@langtap.com
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-warm-800 mb-2">Changes</h2>
            <p>
              We may update this policy from time to time. The date at the top of this page shows
              when it was last changed.
            </p>
          </section>
        </div>
      </main>
      <LandingFooter />
    </div>
  )
}
