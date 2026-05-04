// ─────────────────────────────────────────────
// File: components/game/trial-cap-banner.tsx
// Purpose: Banner shown in place of the game window when a
//          guest user hits the 15m practice distance cap.
//          Uses the same cream card styling as the game window.
//          Mascot (encouraging pose) with sign-up CTA.
// Depends on: stores/auth-modal.store.ts
// ─────────────────────────────────────────────

'use client'

import type { ReactNode } from 'react'
import { useAuthModalStore } from '@/stores/auth-modal.store'

// ── Component ─────────────────────────────────

export function TrialCapBanner(): ReactNode {
  const openSignUp = useAuthModalStore((s) => s.openSignUp)

  return (
    <div
      className="bg-[#faf5e4] rounded-2xl shadow-[0_6px_0_0_#d4c9b0] w-full max-w-md mx-auto relative h-[340px]"
      role="alert"
      data-testid="trial-cap-banner"
    >
      {/* Message area */}
      <div className="absolute top-4 right-4 bottom-14 left-[120px] bg-white rounded-2xl p-5 flex flex-col justify-center">
        <h2 className="text-lg font-bold text-text-primary mb-2">Great progress!</h2>
        <p className="text-sm text-text-secondary leading-relaxed">
          You've practised 15m. Sign up to keep going and save your progress.
        </p>
        {/* Tail */}
        <div
          className="absolute -left-3 bottom-6 w-0 h-0 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-r-[12px] border-r-white"
          aria-hidden="true"
        />
      </div>

      {/* Mascot */}
      <img
        src="/images/mascot/mascot-encouraging.png"
        alt=""
        aria-hidden="true"
        className="absolute bottom-3 left-3 w-[100px] h-[130px] object-contain"
      />

      {/* CTA button */}
      <div className="absolute bottom-3.5 right-4">
        <button
          type="button"
          onClick={openSignUp}
          className="px-4 py-2.5 text-xs font-bold rounded-lg bg-sage-500 text-white shadow-[0_3px_0_0_#456e3d] hover:brightness-105 active:translate-y-[2px] active:shadow-none transition-all duration-75"
        >
          Create account
        </button>
      </div>
    </div>
  )
}
