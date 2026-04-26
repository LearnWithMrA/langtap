// ─────────────────────────────────────────────
// File: components/dojo/kana-dojo-shells.tsx
// Purpose: Loading, error, and empty state shells for the Kana
//          Dojo page. Extracted from kana-dojo-client.tsx.
// Depends on: components/layout/app-top-bar.tsx
// ─────────────────────────────────────────────

import Link from 'next/link'
import type { ReactNode } from 'react'
import { AppTopBar } from '@/components/layout/app-top-bar'

// ── Loading ──────────────────────────────────

export function KanaLoadingShell(): ReactNode {
  const skeletons = Array.from({ length: 5 }, (_, i) => i)
  return (
    <div className="min-h-svh text-[#3e312e]" style={{ backgroundColor: 'var(--color-dojo-bg)' }}>
      <AppTopBar />
      <div className="pt-20 pb-16 px-5">
        <main className="mx-auto max-w-[988px]">
          <div className="h-8 w-40 rounded-lg bg-warm-100 animate-pulse mb-6" />
          {skeletons.map((i) => (
            <div
              key={i}
              className="h-14 w-full rounded-lg bg-warm-100 animate-pulse mb-2"
              aria-hidden="true"
            />
          ))}
        </main>
      </div>
    </div>
  )
}

// ── Error ────────────────────────────────────

export function KanaErrorShell(): ReactNode {
  return (
    <div className="min-h-svh text-[#3e312e]" style={{ backgroundColor: 'var(--color-dojo-bg)' }}>
      <AppTopBar />
      <div className="pt-20 pb-16 px-5">
        <main className="mx-auto max-w-[988px]">
          <div
            role="alert"
            className="rounded-xl bg-blush-100 text-warm-800 p-4 flex flex-col gap-3"
          >
            <p className="text-base font-medium">
              We could not load your progress. Check your connection and try again.
            </p>
            <div>
              <button
                type="button"
                onClick={(): void => window.location.reload()}
                className="bg-sage-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-sage-600 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-500"
              >
                Retry
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

// ── Empty ────────────────────────────────────

export function KanaEmptyShell(): ReactNode {
  return (
    <div className="min-h-svh text-[#3e312e]" style={{ backgroundColor: 'var(--color-dojo-bg)' }}>
      <AppTopBar />
      <div className="pt-20 pb-16 px-5">
        <main className="mx-auto max-w-[988px]">
          <h1 className="text-2xl font-bold mb-6">Kana Dojo</h1>
          <div className="rounded-xl bg-surface-raised border border-border p-6 text-center">
            <h2 className="text-lg font-semibold text-warm-800 mb-2">Start your journey</h2>
            <p className="text-sm text-warm-600 mb-4">
              Tap any character to unlock it, or jump into practice and unlock as you go.
            </p>
            <Link
              href="/practice?mode=kana"
              className="inline-block bg-sage-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-sage-600 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-500"
            >
              Start practice
            </Link>
          </div>
        </main>
      </div>
    </div>
  )
}
