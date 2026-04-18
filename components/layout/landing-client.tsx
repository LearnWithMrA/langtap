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

import type { ReactNode } from 'react'
import { LandingNav } from '@/components/layout/landing-nav'
import { LandingScene } from '@/components/layout/landing-scene'
import { LandingFooter } from '@/components/layout/landing-footer'
import { PricingSection } from '@/components/ui/pricing-card'
import { KeyButton } from '@/components/ui/key-button'
import { useEasterEgg } from '@/hooks/useEasterEgg'

// -- Component ----------------------------------------------

export function LandingClient(): ReactNode {
  const { isActive: easterEggActive } = useEasterEgg()

  return (
    <div className="min-h-screen">
      <LandingNav />

      {/* Easter egg indicator (visually subtle, wired for future logo swap) */}
      {easterEggActive && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2 shadow-lg text-sm text-sage-500 font-medium animate-pulse">
          LT
        </div>
      )}

      {/* Hero section with parallax landscape */}
      <LandingScene>
        <div className="flex flex-col items-center gap-6 text-center max-w-lg">
          <h1 className="text-4xl md:text-5xl font-bold text-warm-800 leading-tight">
            A journey of a thousand miles begins with a single tap.
          </h1>
          <KeyButton
            href="/home"
            className="bg-[#4a90c4] text-white px-8 py-2 text-xl shadow-[0_4px_0_0_#3570a0]"
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
          <div className="mx-auto max-w-2xl">
            <h2 className="text-2xl md:text-3xl font-bold text-warm-800 text-center mb-12">
              Leaderboard
            </h2>
            <div className="rounded-2xl bg-surface-raised p-6 shadow-sm border border-border">
              <p className="text-center text-text-secondary text-sm">
                No scores yet. Start practising to appear here.
              </p>
              <div className="flex justify-center mt-4">
                <KeyButton
                  href="/sign-up"
                  className="bg-mint-500 text-white px-6 py-3 text-sm shadow-[0_4px_0_0_#2a8a6a]"
                  aria-label="Sign up to start practising"
                >
                  Start practising
                </KeyButton>
              </div>
            </div>
          </div>
        </section>
      </div>

      <LandingFooter />
    </div>
  )
}
