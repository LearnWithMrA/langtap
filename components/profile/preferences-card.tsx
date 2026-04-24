// ─────────────────────────────────────────────
// File: components/profile/preferences-card.tsx
// Purpose: Preferences card for the Profile screen. Contains JLPT
//          level (with confirmation modal), scene theme and font
//          (locked for now), and leaderboard visibility.
//          All state is local in Sprint 2B. Yellow pastel theme.
// Depends on: components/profile/profile-icons.tsx,
//             components/ui/modal.tsx
// ─────────────────────────────────────────────

'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import { IconChevron } from '@/components/profile/profile-icons'
import { Modal } from '@/components/ui/modal'

// ── Types ─────────────────────────────────────

type JlptLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1'
type SceneTheme = 'day' | 'sunrise' | 'sunset' | 'night'
type FontFamily = 'Noto Sans JP' | 'Zen Maru Gothic'
type LeaderboardVisibility = 'public' | 'friends' | 'hidden'

const JLPT_LEVELS: JlptLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1']

const THEME_LABELS: Record<SceneTheme, string> = {
  day: 'Day',
  sunrise: 'Sunrise',
  sunset: 'Sunset',
  night: 'Night',
}

// ── Lock icon ─────────────────────────────────

function IconLock(): ReactNode {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x={3} y={11} width={18} height={11} rx={2} />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

// ── Main export ───────────────────────────────

export function PreferencesCard(): ReactNode {
  const [jlptLevel, setJlptLevel] = useState<JlptLevel>('N5')
  const [jlptExpanded, setJlptExpanded] = useState(false)
  const [pendingLevel, setPendingLevel] = useState<JlptLevel | null>(null)
  const [sceneTheme] = useState<SceneTheme>('day')
  const [fontFamily] = useState<FontFamily>('Zen Maru Gothic')
  const [visibility, setVisibility] = useState<LeaderboardVisibility>('public')
  const [visibilityExpanded, setVisibilityExpanded] = useState(false)

  const handleLevelSelect = (level: JlptLevel): void => {
    if (level === jlptLevel) {
      setJlptExpanded(false)
      return
    }
    setPendingLevel(level)
  }

  const confirmLevelChange = (): void => {
    if (pendingLevel) {
      setJlptLevel(pendingLevel)
    }
    setPendingLevel(null)
    setJlptExpanded(false)
  }

  const cancelLevelChange = (): void => {
    setPendingLevel(null)
  }

  return (
    <div
      role="region"
      aria-label="Preferences"
      className="bg-surface-raised rounded-2xl border border-border"
    >
      <p className="text-xs font-medium text-warm-400 uppercase tracking-wider px-4 pt-4 pb-0">
        Preferences
      </p>

      {/* JLPT Level row */}
      <div className="border-b border-border">
        <button
          type="button"
          onClick={(): void => setJlptExpanded(!jlptExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between min-h-[48px] hover:bg-warm-50 transition-colors duration-150"
        >
          <span className="text-sm font-medium text-warm-700">JLPT level</span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-warm-500">{jlptLevel}</span>
            <span className="text-warm-300">
              <IconChevron />
            </span>
          </div>
        </button>
        {jlptExpanded && (
          <div className="px-4 pb-3">
            <div className="flex gap-1.5">
              {JLPT_LEVELS.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={(): void => handleLevelSelect(level)}
                  className={[
                    'flex-1 rounded-full px-3 py-1.5 text-sm transition-colors duration-150',
                    'focus:outline-none focus:ring-2 focus:ring-profile-accent/50',
                    jlptLevel === level
                      ? 'bg-profile-accent text-white font-medium'
                      : 'bg-warm-100 text-warm-500 hover:bg-warm-200',
                  ].join(' ')}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Scene Theme row (locked) */}
      <div className="border-b border-border">
        <div className="w-full px-4 py-3 flex items-center justify-between min-h-[48px] opacity-50 cursor-not-allowed">
          <span className="text-sm font-medium text-warm-700">Scene theme</span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-warm-500 capitalize">{THEME_LABELS[sceneTheme]}</span>
            <span className="text-warm-300">
              <IconLock />
            </span>
          </div>
        </div>
      </div>

      {/* Font Family row (locked) */}
      <div className="border-b border-border">
        <div className="w-full px-4 py-3 flex items-center justify-between min-h-[48px] opacity-50 cursor-not-allowed">
          <span className="text-sm font-medium text-warm-700">Font</span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-warm-500">{fontFamily}</span>
            <span className="text-warm-300">
              <IconLock />
            </span>
          </div>
        </div>
      </div>

      {/* Leaderboard Visibility row */}
      <div>
        <button
          type="button"
          onClick={(): void => setVisibilityExpanded(!visibilityExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between min-h-[48px] hover:bg-warm-50 transition-colors duration-150"
        >
          <span className="text-sm font-medium text-warm-700">Leaderboard</span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-warm-500 capitalize">{visibility}</span>
            <span className="text-warm-300">
              <IconChevron />
            </span>
          </div>
        </button>
        {visibilityExpanded && (
          <div className="px-4 pb-3">
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={(): void => {
                  setVisibility('public')
                  setVisibilityExpanded(false)
                }}
                className={[
                  'flex-1 rounded-full px-3 py-1.5 text-sm transition-colors duration-150',
                  'focus:outline-none focus:ring-2 focus:ring-profile-accent/50',
                  visibility === 'public'
                    ? 'bg-profile-accent text-white font-medium'
                    : 'bg-warm-100 text-warm-500 hover:bg-warm-200',
                ].join(' ')}
              >
                Public
              </button>
              <span className="flex-1 rounded-full px-3 py-1.5 text-sm text-center bg-warm-100 text-warm-300 cursor-not-allowed">
                Friends
                <span className="block text-[10px] text-warm-300">(coming soon)</span>
              </span>
              <button
                type="button"
                onClick={(): void => {
                  setVisibility('hidden')
                  setVisibilityExpanded(false)
                }}
                className={[
                  'flex-1 rounded-full px-3 py-1.5 text-sm transition-colors duration-150',
                  'focus:outline-none focus:ring-2 focus:ring-profile-accent/50',
                  visibility === 'hidden'
                    ? 'bg-profile-accent text-white font-medium'
                    : 'bg-warm-100 text-warm-500 hover:bg-warm-200',
                ].join(' ')}
              >
                Hidden
              </button>
            </div>
          </div>
        )}
      </div>

      {/* JLPT level change confirmation modal */}
      <Modal
        isOpen={pendingLevel !== null}
        onClose={cancelLevelChange}
        onConfirm={confirmLevelChange}
        isDanger
        confirmClassName="!bg-profile-accent hover:!bg-profile-accent-dark !text-white"
        steps={[
          {
            title: 'Change JLPT level?',
            body: `Changing to ${pendingLevel ?? ''} will mark all words below this level as mastered. You will lose progress on those words. This cannot be undone without resetting all progress.`,
            confirmLabel: `Change to ${pendingLevel ?? ''}`,
            cancelLabel: 'Cancel',
          },
        ]}
      />
    </div>
  )
}
