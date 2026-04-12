// ------------------------------------------------------------
// File: components/layout/landscape-background.tsx
// Purpose: Parallax landscape background with rolling hills,
//          animated ground details, and scene theme support.
//          Three hill layers use distinct colour variables
//          (--scene-hill-far, --scene-hill-mid, --scene-hill)
//          for opaque back-to-front depth. Ground details scroll
//          continuously via motion/react.
// Depends on: motion/react
// ------------------------------------------------------------

'use client'

import type { ReactNode } from 'react'
import { motion } from 'motion/react'

// -- Types --------------------------------------------------

type LandscapeBackgroundProps = {
  speed?: number
}

// -- Helpers ------------------------------------------------

// Ground detail SVG: grass tufts, rocks, speed lines.
function GroundDetails(): ReactNode {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 1400 200"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Grass tufts */}
      <path d="M 100 180 L 110 140 L 115 180 L 125 150 L 130 180 Z" fill="rgba(0,0,0,0.15)" />
      <path d="M 400 120 L 405 90 L 410 120 L 415 100 L 420 120 Z" fill="rgba(0,0,0,0.15)" />
      <path d="M 700 190 L 715 140 L 725 190 L 740 160 L 750 190 Z" fill="rgba(0,0,0,0.15)" />
      <path d="M 1000 130 L 1010 90 L 1015 130 L 1025 100 L 1030 130 Z" fill="rgba(0,0,0,0.15)" />
      <path d="M 1250 170 L 1265 120 L 1275 170 L 1290 140 L 1300 170 Z" fill="rgba(0,0,0,0.15)" />
      <path d="M 200 140 L 210 110 L 220 140 Z" fill="rgba(0,0,0,0.15)" />
      <path d="M 850 160 L 860 130 L 870 160 Z" fill="rgba(0,0,0,0.15)" />

      {/* Rocks */}
      <path d="M 250 185 Q 260 170 270 185 Z" fill="rgba(255,255,255,0.4)" />
      <path d="M 600 135 Q 608 125 615 135 Z" fill="rgba(255,255,255,0.4)" />
      <path d="M 880 195 Q 895 175 910 195 Z" fill="rgba(255,255,255,0.4)" />
      <path d="M 1150 125 Q 1158 115 1165 125 Z" fill="rgba(255,255,255,0.4)" />
      <path d="M 1350 185 Q 1360 170 1370 185 Z" fill="rgba(255,255,255,0.4)" />

      {/* Speed lines */}
      <line x1="50" y1="110" x2="150" y2="110" stroke="rgba(0,0,0,0.08)" strokeWidth="3" strokeLinecap="round" />
      <line x1="300" y1="160" x2="450" y2="160" stroke="rgba(0,0,0,0.08)" strokeWidth="3" strokeLinecap="round" />
      <line x1="800" y1="115" x2="900" y2="115" stroke="rgba(0,0,0,0.08)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

// -- Main export --------------------------------------------

export function LandscapeBackground({ speed = 1 }: LandscapeBackgroundProps): ReactNode {
  const groundDuration = speed === 0 ? 999999 : 2.5 / speed

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{ backgroundColor: 'var(--scene-sky-bottom)' }}
    >
      {/* Sky gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to bottom, var(--scene-sky-top), var(--scene-sky-bottom))',
        }}
      />

      {/* Back hills (lightest, furthest) */}
      <div className="absolute bottom-[20%] left-0 right-0">
        <svg
          width="100%"
          height="400"
          viewBox="0 0 1400 400"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M 0 400 L 0 200 Q 200 100 450 250 T 1000 150 T 1400 250 L 1400 400 Z"
            style={{ fill: 'var(--scene-hill-far)' }}
          />
          <path
            d="M 0 400 L 0 280 Q 300 150 700 280 T 1400 180 L 1400 400 Z"
            style={{ fill: 'var(--scene-hill-mid)' }}
          />
        </svg>
      </div>

      {/* Mid hills with bushes (darkest, closest) */}
      <div className="absolute bottom-[10%] left-0 right-0">
        <svg
          width="100%"
          height="250"
          viewBox="0 0 1400 250"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M -50 250 L -50 180 Q 150 50 350 180 T 800 100 T 1200 180 T 1450 120 L 1450 250 Z"
            style={{ fill: 'var(--scene-hill)' }}
          />
          {/* Bushes on mid hills */}
          <g style={{ fill: 'var(--scene-hill)' }}>
            <circle cx="150" cy="140" r="40" />
            <circle cx="190" cy="150" r="30" />
            <circle cx="120" cy="150" r="25" />
            <circle cx="850" cy="150" r="50" />
            <circle cx="910" cy="160" r="35" />
            <circle cx="800" cy="165" r="30" />
            <circle cx="1300" cy="120" r="60" />
            <circle cx="1370" cy="140" r="45" />
            <circle cx="1240" cy="145" r="40" />
          </g>
        </svg>
      </div>

      {/* Foreground ground */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[25%]"
        style={{ backgroundColor: 'var(--scene-ground)' }}
      >
        {/* Lighter ground band */}
        <div
          className="absolute bottom-0 left-0 right-0 h-[50%]"
          style={{ backgroundColor: 'var(--scene-ground)', filter: 'brightness(1.15)' }}
        />

        {/* Continuously scrolling ground details */}
        <motion.div
          className="absolute inset-0 flex"
          animate={{ x: ['0%', '-50%'] }}
          transition={{
            duration: groundDuration,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{ width: '200%' }}
        >
          <div className="w-1/2 h-full relative">
            <GroundDetails />
          </div>
          <div className="w-1/2 h-full relative">
            <GroundDetails />
          </div>
        </motion.div>
      </div>
    </div>
  )
}
