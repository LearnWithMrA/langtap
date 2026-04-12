// ------------------------------------------------------------
// File: components/animation/cycling-character.tsx
// Purpose: Animated cycling mascot using motion/react for smooth
//          path-based leg animation, wheel rotation, and scarf
//          flutter. Speed prop maps to a numeric multiplier:
//          idle=0.3, slow=0.5, medium=1, fast=2.
//          Decorative only. aria-hidden="true".
// Depends on: motion/react
// ------------------------------------------------------------

'use client'

import { motion } from 'motion/react'

// -- Types --------------------------------------------------

type SpeedLevel = 'stopped' | 'idle' | 'slow' | 'medium' | 'fast'

type CyclingCharacterProps = {
  speed: SpeedLevel
}

// -- Constants ----------------------------------------------

const SPEED_MULTIPLIER: Record<SpeedLevel, number> = {
  stopped: 0,
  idle: 0.3,
  slow: 0.5,
  medium: 1,
  fast: 2,
}

// -- Path data for realistic pedaling -----------------------

const RIGHT_LEG_PATHS = [
  'M 125 140 L 165 230 L 160 325',
  'M 125 140 L 175 220 L 135 300',
  'M 125 140 L 185 210 L 160 275',
  'M 125 140 L 175 220 L 185 300',
  'M 125 140 L 165 230 L 160 325',
]

const LEFT_LEG_PATHS = [
  'M 125 140 L 185 210 L 160 275',
  'M 125 140 L 175 220 L 185 300',
  'M 125 140 L 165 230 L 160 325',
  'M 125 140 L 175 220 L 135 300',
  'M 125 140 L 185 210 L 160 275',
]

const RIGHT_SOCK_PATHS = [
  'M 162.5 277.5 L 160 325',
  'M 155 260 L 135 300',
  'M 172.5 242.5 L 160 275',
  'M 180 260 L 185 300',
  'M 162.5 277.5 L 160 325',
]

const LEFT_SOCK_PATHS = [
  'M 172.5 242.5 L 160 275',
  'M 180 260 L 185 300',
  'M 162.5 277.5 L 160 325',
  'M 155 260 L 135 300',
  'M 172.5 242.5 L 160 275',
]

const RIGHT_SHOE_X = [160, 135, 160, 185, 160]
const RIGHT_SHOE_Y = [325, 300, 275, 300, 325]

const LEFT_SHOE_X = [160, 185, 160, 135, 160]
const LEFT_SHOE_Y = [275, 300, 325, 300, 275]

const SCARF_IDLE = [
  'M 190 60 Q 140 70 120 100 Q 130 110 140 100 Q 120 120 110 130 Q 130 125 190 68',
]

const SCARF_MOVING = [
  'M 190 60 Q 140 50 90 70 Q 110 75 140 72 Q 100 85 85 95 Q 130 85 190 68',
  'M 190 60 Q 140 55 85 65 Q 115 70 145 70 Q 105 80 90 90 Q 135 85 190 68',
  'M 190 60 Q 140 50 90 70 Q 110 75 140 72 Q 100 85 85 95 Q 130 85 190 68',
]

// -- Helpers ------------------------------------------------

// Renders a single bicycle wheel with animated spoke rotation
function Wheel({ cx, cy, wheelDuration, stopped }: {
  cx: number
  cy: number
  wheelDuration: number
  stopped: boolean
}): React.ReactElement {
  return (
    <g transform={`translate(${cx}, ${cy})`}>
      <motion.g
        animate={{ rotate: stopped ? 0 : 360 }}
        transition={{
          duration: wheelDuration,
          repeat: stopped ? 0 : Infinity,
          ease: 'linear',
        }}
      >
        {/* Spokes */}
        {Array.from({ length: 16 }).map((_, i) => (
          <line
            key={i}
            x1="-53"
            y1="0"
            x2="53"
            y2="0"
            stroke="#e2e2e2"
            strokeWidth="1.5"
            transform={`rotate(${(i * 180) / 16})`}
          />
        ))}
        {/* Rims and tires */}
        <circle cx="0" cy="0" r="53" fill="none" stroke="#ffffff" strokeWidth="4" />
        <circle cx="0" cy="0" r="57" fill="none" stroke="#121212" strokeWidth="6" />
      </motion.g>
      {/* Hub */}
      <circle cx="0" cy="0" r="6" fill="#17181a" />
    </g>
  )
}

// -- Main export --------------------------------------------

export function CyclingCharacter({ speed }: CyclingCharacterProps): React.ReactElement {
  const multiplier = SPEED_MULTIPLIER[speed]
  const stopped = multiplier === 0
  const wheelDuration = stopped ? 999999 : 1 / multiplier
  const legDuration = stopped ? 999999 : 1 / multiplier
  const scarfDuration = stopped ? 999999 : 0.4 / multiplier

  const transitionConfig = {
    duration: legDuration,
    repeat: stopped ? 0 : Infinity,
    ease: 'linear' as const,
  }

  return (
    <div aria-hidden="true" className="pointer-events-none select-none">
      <svg
        width="400"
        height="380"
        viewBox="0 0 400 380"
        xmlns="http://www.w3.org/2000/svg"
        className="h-auto w-28 md:w-36 lg:w-44 overflow-visible"
      >
        {/* 1. Left leg */}
        <motion.path
          animate={{ d: LEFT_LEG_PATHS }}
          transition={transitionConfig}
          fill="none"
          stroke="#2a2b2e"
          strokeWidth="18"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <motion.path
          animate={{ d: LEFT_SOCK_PATHS }}
          transition={transitionConfig}
          fill="none"
          stroke="#ffffff"
          strokeWidth="19"
          strokeLinecap="round"
        />

        {/* 2. Left shoe */}
        <motion.rect
          width="26"
          height="12"
          rx="4"
          fill="#313134"
          animate={{
            x: LEFT_SHOE_X.map((x) => x - 13),
            y: LEFT_SHOE_Y.map((y) => y - 6),
          }}
          transition={transitionConfig}
        />

        {/* 3. Left crank arm */}
        <motion.line
          x1="160"
          y1="300"
          stroke="#17181a"
          strokeWidth="6"
          strokeLinecap="round"
          animate={{ x2: LEFT_SHOE_X, y2: LEFT_SHOE_Y }}
          transition={transitionConfig}
        />

        {/* 4. Wheels */}
        <Wheel cx={80} cy={300} wheelDuration={wheelDuration} stopped={stopped} />
        <Wheel cx={320} cy={300} wheelDuration={wheelDuration} stopped={stopped} />

        {/* 5. Fenders */}
        <path d="M 20 300 A 62 62 0 0 1 130 255" fill="none" stroke="#121212" strokeWidth="6" strokeLinecap="round" />
        <path d="M 270 270 A 62 62 0 0 1 375 285" fill="none" stroke="#121212" strokeWidth="6" strokeLinecap="round" />

        {/* 6. Bike frame */}
        <g stroke="#17181a" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
          <line x1="80" y1="300" x2="160" y2="300" />
          <line x1="80" y1="300" x2="130" y2="170" />
          <line x1="160" y1="300" x2="130" y2="170" />
          <line x1="160" y1="300" x2="285" y2="200" />
          <line x1="130" y1="170" x2="270" y2="160" />
          <line x1="285" y1="200" x2="320" y2="300" />
        </g>
        <line x1="270" y1="160" x2="285" y2="200" stroke="#17181a" strokeWidth="10" strokeLinecap="round" />

        {/* Seat post and saddle */}
        <line x1="130" y1="170" x2="125" y2="140" stroke="#a0a0a0" strokeWidth="6" strokeLinecap="round" />
        <path d="M 105 140 Q 125 135 140 140 L 148 145 L 105 145 Z" fill="#121212" />

        {/* Handlebars */}
        <line x1="270" y1="160" x2="265" y2="140" stroke="#a0a0a0" strokeWidth="6" strokeLinecap="round" />
        <line x1="255" y1="140" x2="290" y2="140" stroke="#121212" strokeWidth="6" strokeLinecap="round" />

        {/* 7. Chainring and chain */}
        <circle cx="160" cy="300" r="16" fill="none" stroke="#17181a" strokeWidth="6" />
        <line x1="80" y1="294" x2="160" y2="284" stroke="#444" strokeWidth="3" />
        <line x1="80" y1="306" x2="160" y2="316" stroke="#444" strokeWidth="3" />

        {/* 8. Right crank arm */}
        <motion.line
          x1="160"
          y1="300"
          stroke="#17181a"
          strokeWidth="6"
          strokeLinecap="round"
          animate={{ x2: RIGHT_SHOE_X, y2: RIGHT_SHOE_Y }}
          transition={transitionConfig}
        />

        {/* 9. Right leg */}
        <motion.path
          animate={{ d: RIGHT_LEG_PATHS }}
          transition={transitionConfig}
          fill="none"
          stroke="#2a2b2e"
          strokeWidth="18"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <motion.path
          animate={{ d: RIGHT_SOCK_PATHS }}
          transition={transitionConfig}
          fill="none"
          stroke="#ffffff"
          strokeWidth="19"
          strokeLinecap="round"
        />

        {/* 10. Right shoe */}
        <motion.rect
          width="26"
          height="12"
          rx="4"
          fill="#313134"
          animate={{
            x: RIGHT_SHOE_X.map((x) => x - 13),
            y: RIGHT_SHOE_Y.map((y) => y - 6),
          }}
          transition={transitionConfig}
        />

        {/* 11. Torso and jacket */}
        <circle cx="128" cy="130" r="22" fill="#b66f28" />
        <path
          d="M 130 125 Q 160 80 195 70"
          fill="none"
          stroke="#b66f28"
          strokeWidth="45"
          strokeLinecap="round"
        />

        {/* 12. Head and neck */}
        <line x1="195" y1="70" x2="205" y2="55" stroke="#fad1af" strokeWidth="12" strokeLinecap="round" />
        <circle cx="215" cy="40" r="18" fill="#fad1af" />
        <circle cx="222" cy="38" r="2.5" fill="#111" />

        {/* Helmet / cap */}
        <path d="M 197 42 A 18 18 0 0 1 233 42 Z" fill="#242426" />
        <path d="M 233 42 L 243 42 L 238 38 Z" fill="#242426" />
        <path d="M 197 42 L 185 46 L 195 49 L 188 53 L 198 52 Z" fill="#242426" />

        {/* 13. Scarf */}
        <ellipse cx="202" cy="62" rx="12" ry="8" fill="#b66f28" />
        <motion.path
          animate={{
            d: stopped ? SCARF_IDLE : SCARF_MOVING,
          }}
          transition={{
            duration: scarfDuration,
            repeat: stopped ? 0 : Infinity,
            ease: 'easeInOut',
          }}
          fill="#a45f20"
        />

        {/* 14. Arms */}
        <path
          d="M 195 70 L 240 115 L 280 140"
          fill="none"
          stroke="#b66f28"
          strokeWidth="16"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="280" cy="140" r="8" fill="#fad1af" />
      </svg>
    </div>
  )
}
