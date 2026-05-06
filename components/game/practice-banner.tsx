// ─────────────────────────────────────────────
// File: components/game/practice-banner.tsx
// Purpose: Banner shown above the game window, same style as
//          the kana dojo help card. Used for post-trial messages
//          and post-kotoba intro. Supports icon and theme variants.
// Depends on: nothing
// ─────────────────────────────────────────────

'use client'

import type { ReactNode } from 'react'

// ── Types ─────────────────────────────────────

type BannerVariant = 'kana' | 'kotoba'

type PracticeBannerProps = {
  variant?: BannerVariant
  children: ReactNode
  buttonLabel: string
  onAction: () => void
}

// ── Constants ─────────────────────────────────

const VARIANT_STYLES: Record<
  BannerVariant,
  { iconBg: string; icon: string; btnBg: string; btnShadow: string }
> = {
  kana: {
    iconBg: 'bg-[#d0e4f5]',
    icon: 'あ',
    btnBg: 'bg-[#5a82a8]',
    btnShadow: 'shadow-[0_3px_0_0_#3a6288]',
  },
  kotoba: {
    iconBg: 'bg-sage-100',
    icon: '言',
    btnBg: 'bg-sage-500',
    btnShadow: 'shadow-[0_3px_0_0_#456e3d]',
  },
}

// ── Component ─────────────────────────────────

export function PracticeBanner({
  variant = 'kana',
  children,
  buttonLabel,
  onAction,
}: PracticeBannerProps): ReactNode {
  const styles = VARIANT_STYLES[variant]

  return (
    <aside
      aria-label="Practice notice"
      className="bg-cream border border-warm-200 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm mb-3 max-w-md mx-auto"
    >
      <div
        aria-hidden="true"
        className={`flex-shrink-0 w-10 h-10 rounded-full ${styles.iconBg} flex items-center justify-center text-xl leading-none`}
      >
        {styles.icon}
      </div>
      <p className="flex-1 text-sm text-warm-600 leading-snug">{children}</p>
      <button
        type="button"
        onClick={onAction}
        className={`flex-shrink-0 px-3 py-2 text-xs font-bold rounded-lg ${styles.btnBg} text-white ${styles.btnShadow} hover:brightness-105 active:translate-y-[2px] active:shadow-none transition-all duration-75`}
      >
        {buttonLabel}
      </button>
    </aside>
  )
}
