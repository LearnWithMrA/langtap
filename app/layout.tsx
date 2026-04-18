// ------------------------------------------------------------
// File: app/layout.tsx
// Purpose: Root layout. Wraps all pages with html, body, and global providers.
//          Loads Zen Maru Gothic via next/font/google and exposes it as
//          --font-zen-maru CSS variable consumed by the @theme token.
// Depends on: theme/
// ------------------------------------------------------------

import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Zen_Maru_Gothic } from 'next/font/google'
import './globals.css'

const zenMaruGothic = Zen_Maru_Gothic({
  weight: ['300', '400', '500', '700', '900'],
  subsets: ['latin'],
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
  return (
    <html lang="ja" translate="no" className={zenMaruGothic.variable}>
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}
