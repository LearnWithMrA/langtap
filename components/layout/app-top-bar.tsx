// ------------------------------------------------------------
// File: components/layout/app-top-bar.tsx
// Purpose: In-app navigation bar shared across all game screens
//          (home, practice, dojo, leaderboard, profile, settings).
//          Replaces the marketing landing nav for logged-in users.
//          Left: Full logo (desktop) / LT logo (mobile).
//          Centre: Home, Kana Dojo, Kotoba Dojo links.
//          Right: Settings + Profile icons.
//          Transparent background like the landing page nav.
//          All icons use inline SVG so they inherit text colour
//          from Tailwind classes and respond to theme tokens.
// Depends on: components/ui/logo-full.tsx, components/ui/logo-lt.tsx,
//             hooks/useEasterEgg.ts
// ------------------------------------------------------------

'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogoFull } from '@/components/ui/logo-full'
import { LogoLt } from '@/components/ui/logo-lt'
import { useEasterEgg } from '@/hooks/useEasterEgg'
import { useKeySound } from '@/hooks/useKeySound'

// -- Inline SVG icons (use currentColor for theme support) ---

function IconHome(): ReactNode {
  return (
    <svg viewBox="0 0 24 24" width={24} height={24} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12 L12 4 L21 12" />
      <path d="M5 11 L5 20 Q5 21 6 21 L10 21 L10 16 L14 16 L14 21 L18 21 Q19 21 19 20 L19 11" />
    </svg>
  )
}

function IconSettings(): ReactNode {
  return (
    <svg viewBox="0 0 24 24" width={24} height={24} fill="none" stroke="currentColor" strokeWidth={1.3} strokeLinejoin="round">
      <path d="M10.5 2 L13.5 2 L14 5.2 Q15.2 5.7 16.1 6.4 L19.1 5.6 L20.6 8.2 L18.1 10.2 Q18.2 10.6 18.2 11 L18.2 12 Q18.2 12.4 18.2 12.8 L20.6 14.8 L19.1 17.4 L16.1 16.6 Q15.2 17.3 14 17.8 L13.5 21 L10.5 21 L10 17.8 Q8.8 17.3 7.9 16.6 L4.9 17.4 L3.4 14.8 L5.9 12.8 Q5.8 12.4 5.8 12 L5.8 11 Q5.8 10.6 5.9 10.2 L3.4 8.2 L4.9 5.6 L7.9 6.4 Q8.8 5.7 10 5.2 Z" />
      <circle cx={12} cy={11.5} r={3} />
    </svg>
  )
}

function IconTrophy(): ReactNode {
  return (
    <svg viewBox="0 0 24 24" width={24} height={24} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 4 L17 4" />
      <path d="M7 4 L7 11 Q7 17 12 17 Q17 17 17 11 L17 4" />
      <path d="M7 8 Q4 8 4 5 L4 4 L7 4" />
      <path d="M17 8 Q20 8 20 5 L20 4 L17 4" />
      <path d="M12 17 L12 21" />
      <path d="M8 21 L16 21" />
    </svg>
  )
}

function IconProfile(): ReactNode {
  return (
    <svg viewBox="0 0 24 24" width={24} height={24} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx={12} cy={8} r={4} />
      <path d="M4 21 Q4 15 12 15 Q20 15 20 21" />
    </svg>
  )
}

const ICON_LINK = 'min-h-11 min-w-11 flex items-center justify-center rounded-lg transition-all duration-150 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-sage-300'

// -- Component ----------------------------------------------

export function AppTopBar(): ReactNode {
  const pathname = usePathname()
  const { isActive: easterEggActive } = useEasterEgg()
  const { playSound } = useKeySound()

  const isHome = pathname === '/home'
  const isKanaDojo = pathname === '/dojo'
  const isKotobaDojo = pathname === '/dojo/kotoba'
  const isLeaderboard = pathname === '/leaderboard'

  const logoColour = easterEggActive ? 'text-sage-500 scale-105' : 'text-warm-800'

  return (
    <header className="fixed top-0 left-0 right-0 h-14 z-50 flex items-center px-4">
      {/* Left: Logo */}
      <button
        type="button"
        onClick={(): void => playSound('ui-logo')}
        className="flex-none min-h-11 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-sage-300 rounded-lg cursor-pointer"
        aria-label="LangTap logo"
      >
        <LogoFull
          className={[
            'hidden md:block h-7 w-auto transition-all duration-300',
            logoColour,
          ].join(' ')}
        />
        <LogoLt
          className={[
            'md:hidden h-8 w-8 transition-all duration-300',
            logoColour,
          ].join(' ')}
        />
      </button>

      {/* Centre: Navigation */}
      <nav className="flex-1 flex justify-center gap-6 pl-3">
        {/* Desktop text links */}
        <Link
          href="/home"
          className={[
            'hidden md:block text-base transition-all duration-150 min-h-11 leading-[2.75rem] px-3 rounded-lg hover:bg-white/10',
            isHome ? 'text-sage-500 font-bold' : 'text-warm-800 font-medium hover:text-sage-400',
          ].join(' ')}
        >
          Home
        </Link>
        <Link
          href="/dojo"
          className={[
            'hidden md:block text-base transition-all duration-150 min-h-11 leading-[2.75rem] px-3 rounded-lg hover:bg-white/10',
            isKanaDojo ? 'text-sage-500 font-bold' : 'text-warm-800 font-medium hover:text-sage-400',
          ].join(' ')}
        >
          Kana Dojo
        </Link>
        <Link
          href="/dojo/kotoba"
          className={[
            'hidden md:block text-base transition-all duration-150 min-h-11 leading-[2.75rem] px-3 rounded-lg hover:bg-white/10',
            isKotobaDojo ? 'text-sage-500 font-bold' : 'text-warm-800 font-medium hover:text-sage-400',
          ].join(' ')}
        >
          Kotoba Dojo
        </Link>
        <Link
          href="/leaderboard"
          className={[
            'hidden md:block text-base transition-all duration-150 min-h-11 leading-[2.75rem] px-3 rounded-lg hover:bg-white/10',
            isLeaderboard ? 'text-sage-500 font-bold' : 'text-warm-800 font-medium hover:text-sage-400',
          ].join(' ')}
        >
          Leaderboard
        </Link>

        {/* Mobile icon links */}
        <Link
          href="/home"
          className={[
            'md:hidden',
            ICON_LINK,
            isHome ? 'text-sage-500' : 'text-warm-800 hover:text-sage-400',
          ].join(' ')}
          aria-label="Home"
        >
          <IconHome />
        </Link>
        <Link
          href="/dojo"
          className={[
            'md:hidden',
            ICON_LINK,
            isKanaDojo ? 'text-sage-500 font-bold' : 'text-warm-800 hover:text-sage-400',
          ].join(' ')}
          aria-label="Kana Dojo"
        >
          <span className="text-xl">あ</span>
        </Link>
        <Link
          href="/dojo/kotoba"
          className={[
            'md:hidden',
            ICON_LINK,
            isKotobaDojo ? 'text-sage-500 font-bold' : 'text-warm-800 hover:text-sage-400',
          ].join(' ')}
          aria-label="Kotoba Dojo"
        >
          <span className="text-xl">言</span>
        </Link>
        <Link
          href="/leaderboard"
          className={[
            'md:hidden',
            ICON_LINK,
            isLeaderboard ? 'text-sage-500' : 'text-warm-800 hover:text-sage-400',
          ].join(' ')}
          aria-label="Leaderboard"
        >
          <IconTrophy />
        </Link>
      </nav>

      {/* Right: Settings + Profile icons */}
      <div className="flex-none flex gap-2">
        <Link
          href="/settings"
          className={[ICON_LINK, 'text-warm-800 hover:text-sage-400 hover:bg-white/10'].join(' ')}
          aria-label="Settings"
        >
          <IconSettings />
        </Link>
        <Link
          href="/profile"
          className={[ICON_LINK, 'text-warm-800 hover:text-sage-400 hover:bg-white/10'].join(' ')}
          aria-label="Profile"
        >
          <IconProfile />
        </Link>
      </div>
    </header>
  )
}
