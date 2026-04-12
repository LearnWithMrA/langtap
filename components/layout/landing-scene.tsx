// ------------------------------------------------------------
// File: components/layout/landing-scene.tsx
// Purpose: Landing page hero section. Composes the animated
//          LandscapeBackground and CyclingCharacter into a
//          full-viewport scene. All elements animate continuously
//          on load (clouds drift, ground scrolls, character pedals).
//          Supports four scene themes via CSS custom properties.
// Depends on: components/layout/landscape-background.tsx,
//             components/animation/cycling-character.tsx,
//             public/images/ SVG assets (clouds, kanji icons)
// ------------------------------------------------------------

'use client'

import type { ReactNode } from 'react'
import Image from 'next/image'
import { LandscapeBackground } from '@/components/layout/landscape-background'
import { CyclingCharacter } from '@/components/animation/cycling-character'

// -- Types --------------------------------------------------

type LandingSceneProps = {
  children?: ReactNode
}

// -- Cloud set (reused for both halves of the seamless strip) -

function CloudSet(): ReactNode {
  return (
    <div className="relative w-1/2 h-64">
      <div className="absolute top-[10%] left-[5%] w-40 h-20 opacity-80">
        <Image src="/images/cloud-large.svg" alt="" width={160} height={80} className="w-full h-full" />
      </div>
      <div className="absolute top-[25%] left-[30%] w-24 h-12 opacity-60">
        <Image src="/images/cloud-small.svg" alt="" width={100} height={50} className="w-full h-full" />
      </div>
      <div className="absolute top-[8%] left-[55%] w-36 h-16 opacity-70">
        <Image src="/images/cloud-large.svg" alt="" width={160} height={80} className="w-full h-full" />
      </div>
      <div className="absolute top-[30%] left-[75%] w-20 h-10 opacity-50">
        <Image src="/images/cloud-small.svg" alt="" width={100} height={50} className="w-full h-full" />
      </div>
      <div className="absolute top-[15%] left-[90%] w-32 h-14 opacity-75 hidden md:block">
        <Image src="/images/cloud-large.svg" alt="" width={160} height={80} className="w-full h-full" />
      </div>
    </div>
  )
}

// -- Component ----------------------------------------------

export function LandingScene({ children }: LandingSceneProps): ReactNode {
  return (
    <section className="theme-day relative min-h-screen overflow-hidden">
      {/* Animated landscape (sky, hills, ground with continuous motion) */}
      <LandscapeBackground speed={0.3} />

      {/* Clouds layer: continuous drift, below nav (top-16) */}
      <div
        className="absolute top-14 left-0 right-0 h-[55%] overflow-hidden pointer-events-none z-[1]"
        aria-hidden="true"
      >
        <div
          className="flex w-[200%]"
          style={{ animation: 'cloud-drift 60s linear infinite' }}
        >
          <CloudSet />
          <CloudSet />
        </div>
      </div>

      {/* Kanji tree icons floating on the hills */}
      <div className="absolute bottom-[28%] left-0 right-0 pointer-events-none z-[2]" aria-hidden="true">
        <div className="absolute bottom-0 left-[10%] opacity-40">
          <Image src="/images/icon-tree.svg" alt="" width={28} height={28} />
        </div>
        <div className="absolute bottom-4 left-[25%] opacity-30 hidden md:block">
          <Image src="/images/icon-grove.svg" alt="" width={36} height={30} />
        </div>
        <div className="absolute bottom-0 right-[15%] opacity-35 hidden md:block">
          <Image src="/images/icon-forest.svg" alt="" width={40} height={34} />
        </div>
      </div>

      {/* Mascot riding along the dark green mid-hill path, 30% larger */}
      <div className="absolute bottom-[15%] left-4 md:left-[8%] z-[3] scale-[1.3] origin-bottom-left" aria-hidden="true">
        <CyclingCharacter speed="idle" />
      </div>

      {/* Content overlay (hero copy, etc.) - positioned in the sky above the hills */}
      <div className="relative z-20 flex min-h-screen flex-col items-center px-4 pt-[22vh]">
        {children}
      </div>
    </section>
  )
}
