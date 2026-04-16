// ------------------------------------------------------------
// File: components/layout/landing-scene.tsx
// Purpose: Landing page hero section. Composes the animated
//          LandscapeBackground and CyclingCharacter into a
//          full-viewport scene. All elements animate continuously
//          on load (ground scrolls, character pedals). Clouds are
//          rendered by LandscapeBackgroundV2 automatically.
//          Supports four scene themes via CSS custom properties.
// Depends on: components/layout/LandscapeBackgroundV2.tsx,
//             components/animation/cycling-character.tsx
// ------------------------------------------------------------

'use client'

import type { ReactNode } from 'react'
import { LandscapeBackgroundV2 as LandscapeBackground } from '@/components/layout/LandscapeBackgroundV2'
import { CyclingCharacter } from '@/components/animation/cycling-character'

// -- Types --------------------------------------------------

type LandingSceneProps = {
  children?: ReactNode
}

// -- Component ----------------------------------------------

export function LandingScene({ children }: LandingSceneProps): ReactNode {
  return (
    <div className="theme-day relative w-full overflow-hidden">
      <section className="relative h-screen">
        {/* Animated landscape (sky, hills, clouds, ground with continuous motion) */}
        <LandscapeBackground speed="idle" staticHills={false} />

        {/* Mascot riding along the dark green mid-hill path */}
        <div className="absolute bottom-[8%] left-[3%] md:left-[8%] z-[3]" aria-hidden="true">
          <CyclingCharacter speed="idle" />
        </div>

        {/* Content overlay (hero copy, etc.) - positioned in the sky above the hills */}
        <div className="relative z-20 flex h-screen flex-col items-center px-4 pt-[19vh]">
          {children}
        </div>
      </section>

      {/* Curved ground bleed into the content section below */}
      <div className="w-full h-[10vh] md:h-[15vh] pointer-events-none -mt-px bg-white" aria-hidden="true">
        <svg width="100%" height="100%" viewBox="0 0 1600 200" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M 0 0 L 1600 0 L 1600 200 Q 800 0, 0 200 Z" style={{ fill: 'var(--scene-ground)', filter: 'brightness(0.85)' }} />
        </svg>
      </div>
    </div>
  )
}
