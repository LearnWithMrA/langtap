// ------------------------------------------------------------
// File: components/layout/landing-scene.tsx
// Purpose: Landing page hero section. Composes the animated
//          LandscapeBackground and CyclingCharacter into a
//          full-viewport scene. All elements animate continuously
//          on load (ground scrolls, character pedals). Clouds are
//          rendered by LandscapeBackground automatically.
//          Supports four scene themes via CSS custom properties.
// Depends on: components/layout/LandscapeBackground.tsx,
//             components/animation/cycling-character.tsx
// ------------------------------------------------------------

'use client'

import type { ReactNode } from 'react'
import { LandscapeBackground } from '@/components/layout/landscape-background'
import { CyclingCharacter } from '@/components/animation/cycling-character'

// -- Types --------------------------------------------------

type LandingSceneProps = {
  children?: ReactNode
}

// -- Component ----------------------------------------------

export function LandingScene({ children }: LandingSceneProps): ReactNode {
  return (
    <div className="theme-day relative w-full overflow-hidden">
      <section className="relative h-svh">
        {/* Animated landscape (sky, hills, clouds, ground with continuous motion) */}
        <LandscapeBackground speed="idle" staticHills={false} />

        {/* Mascot riding along the dark green mid-hill path.
            Bottom offset compensates for the PNG's transparent bottom padding
            (~22% of container height, scales with viewport width) so her
            wheels sit on the dirt path regardless of screen size. Uses svh
            instead of vh so the hero fits iOS Safari's visible viewport
            (with address bar showing) rather than the large-viewport 100vh,
            which overflows and creates a small unwanted scroll. */}
        <div
          className="absolute bottom-[calc(12svh-max(7.73vw,62.7px))] left-[3%] md:left-[8%] z-[3]"
          aria-hidden="true"
        >
          <CyclingCharacter speed="idle" />
        </div>

        {/* Content overlay (hero copy, etc.) - positioned in the sky above the hills */}
        <div className="relative z-20 flex h-svh flex-col items-center px-4 pt-[16svh] md:pt-[15svh]">
          {children}
        </div>
      </section>

      {/* Curved ground bleed into the content section below */}
      <div
        className="w-full h-[10svh] md:h-[15svh] pointer-events-none -mt-px bg-white"
        aria-hidden="true"
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 1600 200"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M 0 0 L 1600 0 L 1600 200 Q 800 0, 0 200 Z"
            style={{ fill: 'var(--scene-ground)', filter: 'brightness(0.85)' }}
          />
        </svg>
      </div>
    </div>
  )
}
