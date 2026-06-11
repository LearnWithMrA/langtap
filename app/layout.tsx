// ------------------------------------------------------------
// File: app/layout.tsx
// Purpose: Root layout. Wraps all pages with html, body, and global providers.
//          Loads Zen Maru Gothic via next/font/google and exposes it as
//          --font-zen-maru CSS variable consumed by the @theme token.
// Depends on: theme/
// ------------------------------------------------------------

import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import localFont from 'next/font/local'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const zenMaruGothic = localFont({
  src: [
    { path: '../public/fonts/zen-maru-400.woff2', weight: '400', style: 'normal' },
    { path: '../public/fonts/zen-maru-500.woff2', weight: '500', style: 'normal' },
    { path: '../public/fonts/zen-maru-700.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-zen-maru',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'LangTap',
  description: 'Japanese typing fluency app',
  // Block Chrome's built-in Google Translate prompt. The app's Japanese
  // content (kana, romaji, katakana overlays) becomes nonsense when machine-
  // translated, and triggered a page crash + mis-rendered prompts during
  // testing. Renders as <meta name="google" content="notranslate" />.
  other: {
    google: 'notranslate',
  },
}

export default function RootLayout({ children }: { children: ReactNode }): ReactNode {
  const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
    ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
    : null

  return (
    <html lang="ja" translate="no" className={zenMaruGothic.variable}>
      <head>
        {supabaseHostname && (
          <>
            <link rel="dns-prefetch" href={`//${supabaseHostname}`} />
            <link rel="preconnect" href={`//${supabaseHostname}`} crossOrigin="anonymous" />
          </>
        )}
      </head>
      <body suppressHydrationWarning>
        {children}
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  )
}
