// ─────────────────────────────────────────────
// File: components/dashboard/mode-panel.tsx
// Purpose: Kana or Kotoba practice panel for the home dashboard.
//          Shows progress bars, mastery count, leaderboard position,
//          and a themed practice CTA button. Blue for Kana, pastel
//          green for Kotoba. Used twice on the home screen.
// Depends on: samples/dashboard-fixtures.ts
// ─────────────────────────────────────────────

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useKeySound } from '@/hooks/useKeySound'
import type { StageProgress, LeaderboardGlance } from '@/samples/dashboard-fixtures'
import { formatScore } from '@/components/dashboard/dashboard-helpers'

// ── Types ─────────────────────────────────────

type ModePanelProps = {
  variant: 'kana' | 'kotoba'
  stages: readonly StageProgress[]
  leaderboard: LeaderboardGlance
  inputMode: string
  locked?: boolean
}

// ── Theme config ──────────────────────────────

const THEMES = {
  kana: {
    bg: 'bg-dojo-bg/60',
    barFill: 'bg-sky-500',
    barTrack: 'bg-sky-500/20',
    button: 'bg-sky-500 shadow-[0_4px_0_0_#3570a0]',
    buttonLight: 'bg-sky-500/80',
    buttonHover: 'hover:brightness-105',
    accent: 'text-sky-600',
    leaderboardBg: 'bg-sky-500/10',
    leaderboardBorder: 'border-sky-500',
    label: 'Kana',
    ctaLabel: 'Practice Kana',
    masteryLabel: 'Characters mastered',
    route: '/practice?mode=kana',
  },
  kotoba: {
    bg: 'bg-kotoba-dojo-bg/60',
    barFill: 'bg-sage-400',
    barTrack: 'bg-sage-400/20',
    button: 'bg-sage-400 shadow-[0_4px_0_0_#456e3d]',
    buttonLight: 'bg-sage-300',
    buttonHover: 'hover:brightness-105',
    accent: 'text-sage-600',
    leaderboardBg: 'bg-sage-400/10',
    leaderboardBorder: 'border-sage-400',
    label: 'Kotoba',
    ctaLabel: 'Practice Kotoba',
    masteryLabel: 'Words mastered',
    route: '/practice?mode=kotoba',
  },
} as const

// ── Progress bar helper ───────────────────────

function getBarFillWidth(percentage: number): string {
  return `${Math.max(percentage, 0)}%`
}

// ── Main component ────────────────────────────

export function ModePanel({
  variant,
  stages,
  leaderboard,
  inputMode,
  locked = false,
}: ModePanelProps): ReactNode {
  const router = useRouter()
  const { playSound } = useKeySound()
  const theme = THEMES[variant]
  const [expanded, setExpanded] = useState(false)
  const [modeOpen, setModeOpen] = useState(false)
  const [currentMode, setCurrentMode] = useState(inputMode)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const isLarge = window.matchMedia('(min-width: 1024px)').matches
    if (isLarge) setExpanded(true)
  }, [])

  const closeDropdown = useCallback((): void => setModeOpen(false), [])

  useEffect(() => {
    if (!modeOpen) return
    const handleClick = (e: MouseEvent): void => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        closeDropdown()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return (): void => document.removeEventListener('mousedown', handleClick)
  }, [modeOpen, closeDropdown])

  const totalMastered = stages.reduce((sum, s) => sum + s.mastered, 0)
  const totalItems = stages.reduce((sum, s) => sum + s.total, 0)

  const modeLabels: Record<string, string> = {
    tap: 'Tap Mode',
    type: 'Type Mode',
    swipe: 'Swipe Mode',
  }

  return (
    <div
      className={`${theme.bg} backdrop-blur-md rounded-2xl shadow-lg px-4 pb-3 pt-2 sm:px-5 sm:pb-4 sm:pt-2 flex flex-col ${expanded ? 'gap-3' : 'gap-2'} ${locked ? 'opacity-50' : ''} ${modeOpen ? 'z-50 relative' : ''}`}
    >
      {/* Title with collapse toggle */}
      <button
        type="button"
        onClick={(): void => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full hover:opacity-80 transition-opacity duration-150"
        aria-label={expanded ? `Collapse ${theme.label} details` : `Expand ${theme.label} details`}
      >
        <h2 className={`text-lg font-bold ${theme.accent}`}>{theme.label}</h2>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={3.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`${theme.accent} translate-y-[3px] transition-transform duration-200 ${expanded ? '' : '-rotate-90'}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
        {!expanded && (
          <span className="text-xs text-warm-400 translate-y-[3px] -ml-1">Show progress</span>
        )}
      </button>

      {/* Collapsible content */}
      {expanded && (
        <>
          {/* Progress bars */}
          <div className="flex flex-col gap-2">
            {stages.map((stage) => (
              <div key={stage.label}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-medium text-warm-700">{stage.label}</span>
                  <span className="text-xs text-warm-500">{stage.percentage}%</span>
                </div>
                <div
                  className={`h-1.5 rounded-full ${theme.barTrack} overflow-hidden`}
                  role="progressbar"
                  aria-valuenow={stage.percentage}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${stage.label} progress: ${stage.percentage}%`}
                >
                  <div
                    className={`h-full rounded-full ${theme.barFill} transition-all duration-300 ease-out`}
                    style={{ width: getBarFillWidth(stage.percentage) }}
                  />
                </div>
              </div>
            ))}
            <p className="text-xs text-warm-400">
              {theme.masteryLabel}: {totalMastered} / {totalItems}
            </p>
          </div>

          {/* Leaderboard position */}
          <div>
            <p className="text-xs font-medium text-warm-500 mb-1.5">Leaderboard</p>
            {leaderboard.rank ? (
              <div
                className={`${theme.leaderboardBg} rounded-lg px-3 py-2 border-l-4 ${theme.leaderboardBorder} flex items-center justify-between`}
              >
                <span className="text-sm font-bold text-warm-800">#{leaderboard.rank}</span>
                <span className="text-xs text-warm-600">{leaderboard.username}</span>
                <span className={`text-xs font-medium ${theme.accent}`}>
                  {formatScore(leaderboard.score)}
                </span>
              </div>
            ) : (
              <p className="text-xs text-warm-400 italic">Practice to get on the board</p>
            )}
          </div>
        </>
      )}

      {/* Practice CTA with integrated mode selector (always visible) */}
      <div ref={dropdownRef} className={`${expanded ? 'mt-auto' : ''} relative`}>
        <div className="flex rounded-xl shadow-[0_4px_0_0_rgba(0,0,0,0.15)] overflow-hidden">
          {/* Play button */}
          <button
            type="button"
            onClick={(): void => {
              if (locked) return
              playSound('key-click')
              router.push(theme.route)
            }}
            disabled={locked}
            aria-label={
              locked ? `${theme.label} locked` : `Start practising ${theme.label.toLowerCase()}`
            }
            className={`flex-1 text-white text-sm font-bold py-3 ${theme.button} !shadow-none ${theme.buttonHover} active:brightness-90 transition-all duration-75 min-h-[48px] disabled:cursor-not-allowed`}
          >
            {locked ? 'Complete Kana to unlock' : theme.ctaLabel}
          </button>
          {/* Mode dropdown trigger */}
          {!locked && (
            <button
              type="button"
              onClick={(): void => setModeOpen(!modeOpen)}
              aria-label={`Change mode, currently ${modeLabels[currentMode]}`}
              className={`${theme.buttonLight} text-white/90 px-3 flex items-center gap-1 border-l border-white/20 active:brightness-90 transition-all duration-75 min-h-[48px]`}
            >
              <span className="text-xs font-medium">{modeLabels[currentMode]?.split(' ')[0]}</span>
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`transition-transform duration-150 ${modeOpen ? 'rotate-180' : ''}`}
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
          )}
        </div>
        {/* Mode dropdown menu */}
        {modeOpen && !locked && (
          <div
            className={`absolute top-full mt-1 right-0 ${theme.buttonLight} rounded-lg shadow-lg overflow-hidden z-50 whitespace-nowrap`}
          >
            {(['tap', 'type', 'swipe'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={(): void => {
                  setCurrentMode(mode)
                  setModeOpen(false)
                }}
                className={`block px-4 py-2 text-xs font-medium text-left transition-colors duration-150 ${
                  currentMode === mode
                    ? 'text-white bg-white/20'
                    : 'text-white/80 hover:bg-white/10'
                }`}
              >
                {modeLabels[mode]}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
