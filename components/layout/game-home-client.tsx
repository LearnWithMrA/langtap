// ------------------------------------------------------------
// File: components/layout/game-home-client.tsx
// Purpose: Client component composing the full game home screen.
//          Layers the parallax landscape, mascot, in-app top bar,
//          and mode selection buttons into a
//          single full-viewport scene. No scroll. Theme-day default.
//          Reduced-motion support: stops all scene animations.
// Depends on: components/layout/LandscapeBackgroundV2.tsx,
//             components/animation/cycling-character.tsx,
//             components/layout/app-top-bar.tsx,
//             components/game/mode-button.tsx
// ------------------------------------------------------------

'use client'

import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useReducedMotion } from 'motion/react'
import { LandscapeBackgroundV2 } from '@/components/layout/LandscapeBackgroundV2'
import { CyclingCharacter } from '@/components/animation/cycling-character'
import { AppTopBar } from '@/components/layout/app-top-bar'
import { ModeButton } from '@/components/game/mode-button'

// -- Component ----------------------------------------------

export function GameHomeClient(): ReactNode {
  const router = useRouter()
  const prefersReducedMotion = useReducedMotion()

  // Scene animation speed: stopped for reduced-motion, idle otherwise
  const sceneSpeed = prefersReducedMotion ? 'stopped' : 'idle'
  const mascotSpeed = prefersReducedMotion ? 'stopped' : 'idle'

  return (
    <div className="theme-day relative w-full h-screen overflow-hidden">
      {/* Parallax landscape (sky, clouds, hills, ground) */}
      <LandscapeBackgroundV2 speed={sceneSpeed} staticHills={prefersReducedMotion ?? false} />

      {/* Mascot cycling on the ground strip. Bottom offset compensates for
          the PNG's transparent bottom padding (~22% of container height) so
          her wheels sit on the dirt path regardless of viewport size.
          Matches landing-scene. */}
      <div
        className="absolute bottom-[calc(12vh-max(7.73vw,62.7px))] left-[3%] md:left-[8%] z-[3]"
        aria-hidden="true"
      >
        <CyclingCharacter speed={mascotSpeed} />
      </div>

      {/* In-app top bar */}
      <AppTopBar />

      {/* Mode selection buttons */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[80%] md:-translate-y-[100%] z-10 flex flex-col md:flex-row items-center gap-3 md:gap-6 lg:gap-8">
        <ModeButton
          variant="kana"
          label="Practice Kana"
          locked={false}
          onClick={(): void => {
            router.push('/practice?mode=kana')
          }}
        />
        <ModeButton
          variant="kotoba"
          label="Practice Kotoba"
          locked={true}
          onClick={(): void => {
            router.push('/practice?mode=kotoba')
          }}
        />
      </div>
    </div>
  )
}
