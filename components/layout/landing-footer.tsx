// ------------------------------------------------------------
// File: components/layout/landing-footer.tsx
// Purpose: Landing page footer. Links, legal, social icons.
//          Social icons play key-click-soft.wav on interaction.
// Depends on: nothing
// ------------------------------------------------------------

'use client'

import type { ReactNode } from 'react'

// -- Helpers ------------------------------------------------

function playSoftClick(): void {
  const audio = new Audio('/sounds/Keyboard%20Click.mp3')
  audio.volume = 0.3
  audio.play().catch(() => {
    // Sound file may not exist yet
  })
}

// -- Social icon SVGs (inline, charcoal, 24px) ---------------

function TwitterIcon(): ReactNode {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="#3d3028">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function InstagramIcon(): ReactNode {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#3d3028"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="17.5" cy="6.5" r="1.5" fill="#3d3028" stroke="none" />
    </svg>
  )
}

function YouTubeIcon(): ReactNode {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="#3d3028">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  )
}

function TikTokIcon(): ReactNode {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="#3d3028">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.75a8.18 8.18 0 0 0 4.76 1.52v-3.4a4.85 4.85 0 0 1-1-.18z" />
    </svg>
  )
}

// -- Component ----------------------------------------------

export function LandingFooter(): ReactNode {
  const socialLinks = [
    { icon: <TwitterIcon />, label: 'Twitter', href: '#' },
    { icon: <InstagramIcon />, label: 'Instagram', href: '#' },
    { icon: <YouTubeIcon />, label: 'YouTube', href: '#' },
    { icon: <TikTokIcon />, label: 'TikTok', href: '#' },
  ]

  return (
    <footer className="bg-white px-4 py-12">
      <div className="mx-auto max-w-5xl grid grid-cols-1 md:grid-cols-4 gap-8 text-sm text-warm-600">
        {/* About column */}
        <div className="flex flex-col gap-2">
          <a href="#" className="hover:text-text-primary transition-colors">
            About Us
          </a>
          <a href="#" className="hover:text-text-primary transition-colors">
            Contact Us
          </a>
          <a href="#" className="hover:text-text-primary transition-colors">
            FAQ
          </a>
        </div>

        {/* Legal column */}
        <div className="flex flex-col gap-2">
          <a href="#" className="hover:text-text-primary transition-colors">
            Privacy Policy
          </a>
          <a href="#" className="hover:text-text-primary transition-colors">
            Terms of Service
          </a>
        </div>

        {/* Empty spacer for desktop layout */}
        <div className="hidden md:block" />

        {/* Social icons */}
        <div className="flex flex-col gap-3">
          <span className="font-medium text-text-secondary">Follow Us</span>
          <div className="flex gap-4">
            {socialLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                aria-label={link.label}
                className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-warm-100 transition-colors"
                onClick={playSoftClick}
              >
                {link.icon}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 text-center text-xs text-text-muted">
        2026 LangTap. All rights reserved.
      </div>
    </footer>
  )
}
