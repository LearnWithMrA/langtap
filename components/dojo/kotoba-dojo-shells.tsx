// ─────────────────────────────────────────────
// File: components/dojo/kotoba-dojo-shells.tsx
// Purpose: Loading, error, and empty state shells for the Kotoba
//          Dojo page. Extracted from kotoba-dojo-client.tsx to keep
//          the main orchestrator under the 300-line limit.
// Depends on: components/layout/app-top-bar.tsx
// ─────────────────────────────────────────────

import Link from 'next/link'
import type { ReactNode } from 'react'
import { AppTopBar } from '@/components/layout/app-top-bar'

// ── Loading ──────────────────────────────────

export function KotobaLoadingShell(): ReactNode {
  const skeletonTiles = Array.from({ length: 6 }, (_, i) => i)
  return (
    <div
      className="min-h-svh text-warm-800"
      style={{ backgroundColor: 'var(--color-kotoba-dojo-bg)' }}
    >
      <AppTopBar />
      <div className="pt-20 pb-16 px-5">
        <main className="mx-auto max-w-[988px]">
          <div className="h-8 w-40 rounded-lg bg-warm-100 animate-pulse mb-6" />
          <div className="h-11 w-full max-w-sm rounded-lg bg-warm-100 animate-pulse mb-6" />
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}
          >
            {skeletonTiles.map((i) => (
              <div
                key={i}
                className="h-32 rounded-xl bg-warm-100 animate-pulse"
                aria-hidden="true"
              />
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}

// ── Error ────────────────────────────────────

export function KotobaErrorShell(): ReactNode {
  return (
    <div
      className="min-h-svh text-warm-800"
      style={{ backgroundColor: 'var(--color-kotoba-dojo-bg)' }}
    >
      <AppTopBar />
      <div className="pt-20 pb-16 px-5">
        <main className="mx-auto max-w-[988px]">
          <div
            role="alert"
            className="rounded-xl bg-blush-100 text-warm-800 p-4 flex flex-col gap-3"
          >
            <p className="text-base font-medium">
              We could not load your Kotoba progress. Check your connection and try again.
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

export function KotobaEmptyShell(): ReactNode {
  return (
    <div
      className="min-h-svh text-warm-800"
      style={{ backgroundColor: 'var(--color-kotoba-dojo-bg)' }}
    >
      <AppTopBar />
      <div className="pt-20 pb-16 px-5">
        <main className="mx-auto max-w-[988px]">
          <h1 className="text-2xl font-bold mb-6">Kotoba Dojo</h1>
          <div className="rounded-xl bg-surface-raised border border-border p-6 text-center">
            <h2 className="text-lg font-semibold text-warm-800 mb-2">
              Start building your vocabulary
            </h2>
            <p className="text-sm text-warm-600 mb-4">
              Pick a unit to see the words inside, or jump straight into Kotoba practice.
            </p>
            <Link
              href="/practice?mode=kotoba"
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
