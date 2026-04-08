// ------------------------------------------------------------
// File: app/layout.tsx
// Purpose: Root layout. Wraps all pages with html, body, and global providers.
// Depends on: theme/
// ------------------------------------------------------------

import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'LangTap',
  description: 'Japanese typing fluency app',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
