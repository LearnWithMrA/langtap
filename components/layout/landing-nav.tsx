// ------------------------------------------------------------
// File: components/layout/landing-nav.tsx
// Purpose: Sticky top navigation for the landing page.
//          Transparent at top, frosted white after 80px scroll.
//          Full SVG logo on desktop, compact LT logo on mobile.
//          Key-style nav buttons for auth links.
// Depends on: components/ui/key-button.tsx,
//             components/ui/logo-full.tsx,
//             components/ui/logo-lt.tsx
// ------------------------------------------------------------

'use client'

import { useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import { KeyButton } from '@/components/ui/key-button'
import { LogoFull } from '@/components/ui/logo-full'
import { LogoLt } from '@/components/ui/logo-lt'

// -- Constants ----------------------------------------------

const SCROLL_THRESHOLD = 80
const NAV_LINKS = [
  { label: 'About', href: '#about' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Leaderboard', href: '#leaderboard' },
] as const

// -- Logo helpers -------------------------------------------

// Plays key click on logo press
function playLogoClick(): void {
  const audio = new Audio('/sounds/Keyboard%20Click.mp3')
  audio.volume = 0.6
  audio.play().catch(() => {})
}

// -- Component ----------------------------------------------

export function LandingNav(): ReactNode {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect((): (() => void) => {
    const handleScroll = (): void => {
      setScrolled(window.scrollY > SCROLL_THRESHOLD)
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const closeMenu = useCallback((): void => {
    setMenuOpen(false)
  }, [])

  return (
    <>
      <nav
        className={[
          'fixed top-0 left-0 right-0 z-50 h-16',
          'transition-all duration-200',
          scrolled
            ? 'bg-white/80 backdrop-blur-sm border-b border-border'
            : 'bg-transparent',
        ].join(' ')}
      >
        <div className="mx-auto flex h-full max-w-5xl items-center justify-between px-4">
          {/* Logo: full on desktop, LT on mobile */}
          <button
            type="button"
            onClick={playLogoClick}
            className="flex items-center cursor-pointer active:translate-y-[2px] transition-transform duration-75"
            aria-label="LangTap home"
          >
            <LogoFull className="hidden md:block h-9 w-auto text-warm-800" />
            <LogoLt className="block md:hidden h-10 w-auto text-warm-800" />
          </button>

          {/* Desktop centre links */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-base font-bold text-warm-800 hover:text-text-primary transition-all duration-150 hover:underline"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop right: auth buttons */}
          <div className="hidden md:flex items-center gap-3">
            <KeyButton
              href="/log-in"
              className="bg-navy-deep text-white px-4 py-1.5 text-base shadow-[0_3px_0_0_#5088aa]"
              aria-label="Log in to LangTap"
            >
              Log In
            </KeyButton>
            <KeyButton
              href="/sign-up"
              className="bg-mint-500 text-white px-4 py-1.5 text-base shadow-[0_3px_0_0_#2a8a6a]"
              aria-label="Sign up for LangTap"
            >
              Sign Up
            </KeyButton>
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            className="md:hidden flex items-center justify-center w-11 h-11"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="6" y1="6" x2="18" y2="18" />
                <line x1="6" y1="18" x2="18" y2="6" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="18" x2="20" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile full-screen menu overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-sage-50 flex flex-col items-center justify-center gap-8 pt-16">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={closeMenu}
              className="text-2xl font-medium text-text-primary hover:text-sage-500 transition-colors duration-150"
            >
              {link.label}
            </a>
          ))}
          <div className="flex flex-col gap-4 w-64 mt-4">
            <KeyButton
              href="/sign-up"
              className="bg-mint-500 text-white px-6 py-3 text-lg shadow-[0_4px_0_0_#2a8a6a] w-full justify-center"
              aria-label="Sign up for LangTap"
            >
              Sign Up
            </KeyButton>
            <KeyButton
              href="/log-in"
              className="bg-navy-deep text-white px-6 py-3 text-lg shadow-[0_4px_0_0_#0f2540] w-full justify-center"
              aria-label="Log in to LangTap"
            >
              Log In
            </KeyButton>
          </div>
        </div>
      )}
    </>
  )
}
