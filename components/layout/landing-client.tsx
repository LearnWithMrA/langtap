// ------------------------------------------------------------
// File: components/layout/landing-client.tsx
// Purpose: Client-side wrapper for the landing page. Composes
//          all interactive elements: nav, scene, easter egg,
//          pricing, and footer. The page.tsx server component
//          renders this as a client island.
// Depends on: components/layout/landing-nav.tsx,
//             components/layout/landing-scene.tsx,
//             components/layout/landing-footer.tsx,
//             components/ui/key-button.tsx,
//             components/ui/pricing-card.tsx,
//             hooks/useEasterEgg.ts
// ------------------------------------------------------------

'use client'

import { useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import { LandingNav } from '@/components/layout/landing-nav'
import { LandingScene } from '@/components/layout/landing-scene'
import { LandingFooter } from '@/components/layout/landing-footer'
import { PricingSection } from '@/components/ui/pricing-card'
import { KeyButton } from '@/components/ui/key-button'
import { AuthModal } from '@/components/ui/auth-modal'
import { LogInCard } from '@/components/ui/log-in-card'
import { SignUpCard } from '@/components/ui/sign-up-card'
import { useEasterEgg } from '@/hooks/useEasterEgg'
import { LeaderboardList } from '@/components/leaderboard/leaderboard-list'
import { getLeaderboardFixture } from '@/samples/leaderboard-fixtures'
import type { InputMode } from '@/samples/leaderboard-fixtures'

// -- Types --------------------------------------------------

type AuthModal_ = 'log-in' | 'sign-up' | null

// -- Component ----------------------------------------------

export function LandingClient(): ReactNode {
  const { isActive: easterEggActive } = useEasterEgg()
  const [authModal, setAuthModal] = useState<AuthModal_>(null)
  const [kanaMode, setKanaMode] = useState<InputMode>('tap')
  const [kotobaMode, setKotobaMode] = useState<InputMode>('tap')

  const closeAuth = useCallback((): void => setAuthModal(null), [])
  const openLogIn = useCallback((): void => setAuthModal('log-in'), [])
  const openSignUp = useCallback((): void => setAuthModal('sign-up'), [])

  return (
    <div className="min-h-svh">
      <LandingNav onOpenLogIn={openLogIn} onOpenSignUp={openSignUp} />

      {/* Easter egg indicator (visually subtle, wired for future logo swap) */}
      {easterEggActive && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2 shadow-lg text-sm text-sage-500 font-medium animate-pulse">
          LT
        </div>
      )}

      {/* Hero section with parallax landscape */}
      <LandingScene>
        <div className="flex flex-col items-center gap-4 md:gap-6 text-center max-w-lg">
          <h1 className="text-[2rem] leading-snug sm:text-4xl md:text-5xl font-bold text-warm-800 sm:leading-tight">
            A journey of a thousand miles begins with a single tap.
          </h1>
          <KeyButton
            href="/onboarding/step-1"
            className="bg-[#4a90c4] text-white px-6 py-1.5 text-lg sm:px-8 sm:py-2 sm:text-xl shadow-[0_4px_0_0_#3570a0]"
            aria-label="Try LangTap now as a guest"
          >
            Try it now
          </KeyButton>
        </div>
      </LandingScene>

      {/* Content sections below the hero */}
      <div className="bg-white">
        {/* Section A: How it works */}
        <section id="about" className="px-4 pt-7 pb-12 md:pt-11 md:pb-20">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-2xl md:text-3xl font-bold text-warm-800 text-center mb-12">
              How it works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-sage-100 flex items-center justify-center">
                  <span className="text-2xl text-sage-500"> </span>
                </div>
                <h3 className="text-lg font-medium text-warm-800">Choose your characters</h3>
                <p className="text-sm text-warm-600 leading-relaxed">
                  Start with the basics and unlock new characters as you go. Or skip ahead if you
                  already know some kana.
                </p>
              </div>
              <div className="flex flex-col items-center text-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-mint-100 flex items-center justify-center">
                  <span className="text-2xl text-mint-500"> </span>
                </div>
                <h3 className="text-lg font-medium text-warm-800">Type, tap, or swipe</h3>
                <p className="text-sm text-warm-600 leading-relaxed">
                  Use your physical keyboard, tap on screen, or swipe on your phone. Three ways to
                  build speed.
                </p>
              </div>
              <div className="flex flex-col items-center text-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-blush-100 flex items-center justify-center">
                  <span className="text-2xl text-blush-300"> </span>
                </div>
                <h3 className="text-lg font-medium text-warm-800">Watch your progress</h3>
                <p className="text-sm text-warm-600 leading-relaxed">
                  The Dojo shows your mastery heatmap. Characters you struggle with appear more
                  often.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section B: Pricing */}
        <section id="pricing" className="px-4 py-16 md:py-24 bg-cream">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-2xl md:text-3xl font-bold text-warm-800 text-center mb-12">
              Pricing
            </h2>
            <PricingSection />
          </div>
        </section>

        {/* Section C: Leaderboard preview */}
        <section id="leaderboard" className="px-4 py-16 md:py-24">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-2xl md:text-3xl font-bold text-warm-800 text-center mb-12">
              Leaderboard
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <LeaderboardList
                board={{ ...getLeaderboardFixture('kana', kanaMode, 'all-time'), currentUserPinned: null }}
                variant="kana"
                mode={kanaMode}
                onModeChange={setKanaMode}
              />
              <LeaderboardList
                board={{ ...getLeaderboardFixture('kotoba', kotobaMode, 'all-time'), currentUserPinned: null }}
                variant="kotoba"
                mode={kotobaMode}
                onModeChange={setKotobaMode}
              />
            </div>
          </div>
        </section>
      </div>

      <LandingFooter />

      {/* Auth modal overlay */}
      {authModal !== null && (
        <AuthModal onClose={closeAuth}>
          {authModal === 'log-in' ? (
            <LogInCard onClose={closeAuth} onSwitchToSignUp={openSignUp} />
          ) : (
            <SignUpCard onClose={closeAuth} onSwitchToLogIn={openLogIn} />
          )}
        </AuthModal>
      )}
    </div>
  )
}
