// ─────────────────────────────────────────────
// File: app/(main)/(scene)/layout.tsx
// Purpose: Shared scene layout for routes that show the landscape
//          background and cyclist animation (home, practice).
//          Wraps children with a persistent background layer so
//          navigation between home and practice does not unmount
//          and remount the landscape or cyclist. Background is
//          pointer-events-none and fixed at z-0. Pages render
//          content above at z-10.
// Depends on: components/layout/landscape-background.tsx,
//             components/animation/cycling-character.tsx,
//             components/audio/audio-player.tsx
// ─────────────────────────────────────────────

'use client'

import type { ReactNode } from 'react'
import { useReducedMotion } from 'motion/react'
import { LandscapeBackground } from '@/components/layout/landscape-background'
import { CyclingCharacter } from '@/components/animation/cycling-character'
import { AudioPlayer } from '@/components/audio/audio-player'

export default function SceneLayout({ children }: { children: ReactNode }): ReactNode {
  const prefersReducedMotion = useReducedMotion()
  const sceneSpeed = prefersReducedMotion ? 'stopped' : 'idle'
  const animated = !prefersReducedMotion

  return (
    <div className="theme-day relative w-full min-h-svh">
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <LandscapeBackground
          speed={sceneSpeed}
          staticHills={prefersReducedMotion ?? false}
          animated={animated}
        />
        <div
          className="absolute bottom-[calc(12svh-max(7.73vw,62.7px))] -left-[2%] md:left-[3%] z-[3]"
          aria-hidden="true"
        >
          <CyclingCharacter speed={sceneSpeed} />
        </div>
      </div>
      <div className="fixed bottom-4 right-4 z-20">
        <AudioPlayer />
      </div>
      <div className="relative z-10 w-full">{children}</div>
    </div>
  )
}
