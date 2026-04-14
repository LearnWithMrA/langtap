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
import { LandscapeBackgroundV2 as LandscapeBackground } from '@/components/layout/LandscapeBackgroundV2'
import { CyclingCharacter } from '@/components/animation/cycling-character'

// -- Types --------------------------------------------------

type LandingSceneProps = {
  children?: ReactNode
}

// -- Cloud set (reused for both halves of the seamless strip) -

function CloudSet(): ReactNode {
  return (
    <div className="relative w-1/2 h-full">
      <div className="absolute top-[10%] left-[5%] w-[10vw] min-w-20 max-w-40 aspect-[2/1] opacity-80">
        <Image src="/images/cloud-large.svg" alt="" width={160} height={80} className="w-full h-full" />
      </div>
      <div className="absolute top-[25%] left-[30%] w-[6vw] min-w-14 max-w-24 aspect-[2/1] opacity-60">
        <Image src="/images/cloud-small.svg" alt="" width={100} height={50} className="w-full h-full" />
      </div>
      <div className="absolute top-[8%] left-[55%] w-[9vw] min-w-20 max-w-36 aspect-[2.25/1] opacity-70">
        <Image src="/images/cloud-large.svg" alt="" width={160} height={80} className="w-full h-full" />
      </div>
      <div className="absolute top-[30%] left-[75%] w-[5vw] min-w-12 max-w-20 aspect-[2/1] opacity-50">
        <Image src="/images/cloud-small.svg" alt="" width={100} height={50} className="w-full h-full" />
      </div>
      <div className="absolute top-[15%] left-[90%] w-[8vw] min-w-20 max-w-32 aspect-[2.3/1] opacity-75 hidden md:block">
        <Image src="/images/cloud-large.svg" alt="" width={160} height={80} className="w-full h-full" />
      </div>
    </div>
  )
}

// -- Component ----------------------------------------------

export function LandingScene({ children }: LandingSceneProps): ReactNode {
  return (
    <section className="theme-day relative h-screen overflow-visible">
      {/* Animated landscape (sky, hills, ground with continuous motion) */}
      <LandscapeBackground speed={0.3} staticHills={false} />

      {/* Clouds layer: continuous drift, below nav (top-16) */}
      <div
        className="absolute top-14 left-0 right-0 h-[45vh] overflow-hidden pointer-events-none z-[1]"
        aria-hidden="true"
      >
        <div
          className="flex w-[200%] h-full"
          style={{ animation: 'cloud-drift 60s linear infinite' }}
        >
          <CloudSet />
          <CloudSet />
        </div>
      </div>



      {/* Mascot riding along the dark green mid-hill path */}
      <div className="absolute bottom-[8%] left-[3%] md:left-[8%] z-[3]" aria-hidden="true">
        <CyclingCharacter speed="idle" />
      </div>

      {/* Content overlay (hero copy, etc.) - positioned in the sky above the hills */}
      <div className="relative z-20 flex h-screen flex-col items-center px-4 pt-[19vh]">
        {children}
      </div>
    </section>
  )
}
