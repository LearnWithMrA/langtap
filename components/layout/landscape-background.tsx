// ------------------------------------------------------------
// File: components/layout/landscape-background.tsx
// Purpose: Parallax landscape background with layered hills,
//          vector shrubbery, drifting clouds, and a ground bleed
//          that flows into the section beneath it.
//          Clouds drift continuously right-to-left via the
//          cloud-drift keyframe defined in globals.css.
// Depends on: motion/react, next/image,
//             public/images/cloud-large.svg,
//             public/images/cloud-small.svg
// ------------------------------------------------------------

'use client'

import type { ReactNode } from 'react'
import {
  Furthest1,
  Furthest2,
  Furthest3,
  Furthest4,
  GroundBase,
  GroundFoliage,
  GroundBlendEdge,
} from '@/components/layout/landscape-layers'
import Image from 'next/image'
import { motion } from 'motion/react'

// -- Types --------------------------------------------------

type SceneSpeed = 'idle' | 'slow' | 'medium' | 'fast' | 'stopped'

const SPEED_MULTIPLIERS: Record<SceneSpeed, number> = {
  stopped: 0,
  idle: 0.3,
  slow: 0.5,
  medium: 1,
  fast: 2,
}

type LandscapeBackgroundProps = {
  speed?: SceneSpeed
  staticHills?: boolean
}

// -- Clouds -------------------------------------------------

function CloudSet(): ReactNode {
  return (
    <div className="relative w-1/2 h-full">
      <div className="absolute top-[10%] left-[5%] w-[10vw] min-w-20 max-w-40 aspect-[2/1] opacity-80">
        <Image
          src="/images/cloud-large.svg"
          alt=""
          width={160}
          height={80}
          className="w-full h-full"
        />
      </div>
      <div className="absolute top-[25%] left-[30%] w-[6vw] min-w-14 max-w-24 aspect-[2/1] opacity-60">
        <Image
          src="/images/cloud-small.svg"
          alt=""
          width={100}
          height={50}
          className="w-full h-full"
        />
      </div>
      <div className="absolute top-[8%] left-[55%] w-[9vw] min-w-20 max-w-36 aspect-[2.25/1] opacity-70">
        <Image
          src="/images/cloud-large.svg"
          alt=""
          width={160}
          height={80}
          className="w-full h-full"
        />
      </div>
      <div className="absolute top-[30%] left-[75%] w-[5vw] min-w-12 max-w-20 aspect-[2/1] opacity-50">
        <Image
          src="/images/cloud-small.svg"
          alt=""
          width={100}
          height={50}
          className="w-full h-full"
        />
      </div>
      <div className="absolute top-[15%] left-[90%] w-[8vw] min-w-20 max-w-32 aspect-[2.3/1] opacity-75 hidden md:block">
        <Image
          src="/images/cloud-large.svg"
          alt=""
          width={160}
          height={80}
          className="w-full h-full"
        />
      </div>
    </div>
  )
}

function CloudsLayer(): ReactNode {
  return (
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
  )
}

// -- Helpers ------------------------------------------------

export function LandscapeBackground({
  speed = 'idle',
  staticHills = false,
}: LandscapeBackgroundProps): ReactNode {
  const multiplier = SPEED_MULTIPLIERS[speed]
  const groundDuration = multiplier === 0 ? 999999 : 2.5 / multiplier
  const midFrontDuration = groundDuration * 6
  const midBackDuration = groundDuration * 12
  const farHillDuration = groundDuration * 24

  return (
    <div
      className="absolute inset-0 overflow-visible"
      style={{ backgroundColor: 'var(--scene-sky-bottom)' }}
    >
      {/* Sky Gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to bottom, var(--scene-sky-top), var(--scene-sky-bottom))',
        }}
      />

      {/* Drifting clouds layer */}
      <CloudsLayer />

      {/* Far Hills Back Ridge (Slowest) */}
      <div className="absolute bottom-[27%] left-0 right-0 h-[40%]">
        {staticHills ? (
          <div className="absolute inset-0">
            <Furthest1 />
          </div>
        ) : (
          <motion.div
            className="absolute inset-0 flex"
            animate={{ x: ['0%', '-50%'] }}
            transition={{ duration: farHillDuration, repeat: Infinity, ease: 'linear' }}
            style={{ width: '200%' }}
          >
            <div className="w-1/2 h-full relative">
              <Furthest1 />
            </div>
            <div className="w-1/2 h-full relative">
              <Furthest1 />
            </div>
            <div
              className="absolute left-[50%] top-[35%] w-1 h-[65%] -ml-px"
              style={{ backgroundColor: 'var(--scene-hill-far-pale)' }}
            />
          </motion.div>
        )}
      </div>

      {/* Far Hills Front Ridge */}
      <div className="absolute bottom-[27%] left-0 right-0 h-[40%]">
        {staticHills ? (
          <div className="absolute inset-0">
            <Furthest2 />
          </div>
        ) : (
          <motion.div
            className="absolute inset-0 flex"
            animate={{ x: ['0%', '-50%'] }}
            transition={{ duration: farHillDuration * 0.9, repeat: Infinity, ease: 'linear' }}
            style={{ width: '200%' }}
          >
            <div className="w-1/2 h-full relative">
              <Furthest2 />
            </div>
            <div className="w-1/2 h-full relative">
              <Furthest2 />
            </div>
            <div
              className="absolute left-[50%] top-[45%] w-1 h-[55%] -ml-px"
              style={{ backgroundColor: 'var(--scene-hill-far)' }}
            />
          </motion.div>
        )}
      </div>

      {/* Mid Back Hills */}
      <div className="absolute bottom-[20%] left-0 right-0 h-[35%]">
        {staticHills ? (
          <div className="absolute inset-0">
            <Furthest3 />
          </div>
        ) : (
          <motion.div
            className="absolute inset-0 flex"
            animate={{ x: ['0%', '-50%'] }}
            transition={{ duration: midBackDuration, repeat: Infinity, ease: 'linear' }}
            style={{ width: '200%' }}
          >
            <div className="w-1/2 h-full relative">
              <Furthest3 />
            </div>
            <div className="w-1/2 h-full relative">
              <Furthest3 />
            </div>
            <div
              className="absolute left-[50%] top-[55%] w-1 h-[45%] -ml-px"
              style={{ backgroundColor: 'var(--scene-hill-mid)' }}
            />
          </motion.div>
        )}
      </div>

      {/* Mid Front Hills */}
      <div className="absolute bottom-[14%] left-0 right-0 h-[30%]">
        {staticHills ? (
          <div className="absolute inset-0">
            <Furthest4 />
          </div>
        ) : (
          <motion.div
            className="absolute inset-0 flex"
            animate={{ x: ['0%', '-50%'] }}
            transition={{ duration: midFrontDuration, repeat: Infinity, ease: 'linear' }}
            style={{ width: '200%' }}
          >
            <div className="w-1/2 h-full relative">
              <Furthest4 />
            </div>
            <div className="w-1/2 h-full relative">
              <Furthest4 />
            </div>
            <div
              className="absolute left-[50%] top-[65%] w-1 h-[35%] -ml-px"
              style={{ backgroundColor: 'var(--scene-hill-front)' }}
            />
          </motion.div>
        )}
      </div>

      {/* Ground Base Layer (behind cyclist, z-[2]) */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[25%] z-[2]"
        style={{ backgroundColor: 'var(--scene-ground)' }}
      >
        <motion.div
          className="absolute inset-0 flex"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: groundDuration, repeat: Infinity, ease: 'linear' }}
          style={{ width: '200%' }}
        >
          <div className="w-1/2 h-full relative">
            <GroundBase />
          </div>
          <div className="w-1/2 h-full relative">
            <GroundBase />
          </div>
          {/* Seam cover: dirt path zone */}
          <div
            className="absolute left-[50%] top-[17%] w-1 h-[43%] -ml-px"
            style={{ backgroundColor: 'var(--scene-path)' }}
          />
        </motion.div>
      </div>

      {/* Ground Foliage Layer (in front of cyclist, z-[4]) */}
      <div className="absolute bottom-0 left-0 right-0 h-[25%] z-[4] pointer-events-none">
        <motion.div
          className="absolute inset-0 flex"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: groundDuration, repeat: Infinity, ease: 'linear' }}
          style={{ width: '200%' }}
        >
          <div className="w-1/2 h-full relative">
            <GroundFoliage />
          </div>
          <div className="w-1/2 h-full relative">
            <GroundFoliage />
          </div>
          {/* Seam cover: dark grass zone */}
          <div
            className="absolute left-[50%] top-[60%] w-1 h-[40%] -ml-px"
            style={{ backgroundColor: 'var(--scene-grass-dark)' }}
          />
        </motion.div>
      </div>

      {/* Massive downward green swoop extending over the #about section! */}
      <GroundBlendEdge />
    </div>
  )
}
