// ─────────────────────────────────────────────
// File: components/game/dialogue-overlay.tsx
// Purpose: Dialogue card with mascot character and typewriter
//          text animation. Renders in place of the game window.
//          All messages flow continuously in a single scrollable
//          bubble. Fixed card height, mascot bottom-left, bubble
//          fills remaining space. Supports themed card colours
//          (blue for kana, green for kotoba, cream default).
// Depends on: nothing
// ─────────────────────────────────────────────

'use client'

import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react'

// ── Constants ─────────────────────────────────

const TYPEWRITER_SPEED_MS = 70

const MASCOT_IMAGES: Record<MascotPose, string> = {
  neutral: '/images/mascot/mascot-neutral.png',
  encouraging: '/images/mascot/mascot-encouraging.png',
  thinking: '/images/mascot/mascot-thinking.png',
}

type ThemeStyle = {
  card: string
  skipBg: string
  skipText: string
  skipShadow: string
  gotItBg: string
  gotItShadow: string
}

const THEME_STYLES: Record<DialogueTheme, ThemeStyle> = {
  cream: {
    card: 'bg-[#faf5e4] shadow-[0_6px_0_0_#d4c9b0]',
    skipBg: 'bg-warm-200',
    skipText: 'text-warm-600',
    skipShadow: 'shadow-[0_3px_0_0_#b8a898]',
    gotItBg: 'bg-sage-500',
    gotItShadow: 'shadow-[0_3px_0_0_#456e3d]',
  },
  blue: {
    card: 'bg-[#dce8f5] shadow-[0_6px_0_0_#a8bed8]',
    skipBg: 'bg-[#c0d4ea]',
    skipText: 'text-[#4a6a8a]',
    skipShadow: 'shadow-[0_3px_0_0_#8aa8c8]',
    gotItBg: 'bg-[#5a82a8]',
    gotItShadow: 'shadow-[0_3px_0_0_#3a6288]',
  },
  green: {
    card: 'bg-[#ddf0e8] shadow-[0_6px_0_0_#a0d0b8]',
    skipBg: 'bg-[#b8e0cc]',
    skipText: 'text-[#3a6a50]',
    skipShadow: 'shadow-[0_3px_0_0_#80c0a0]',
    gotItBg: 'bg-[#4a8a60]',
    gotItShadow: 'shadow-[0_3px_0_0_#2a6a40]',
  },
}

// ── Types ─────────────────────────────────────

export type MascotPose = 'neutral' | 'encouraging' | 'thinking'
export type DialogueTheme = 'cream' | 'blue' | 'green'

type DialogueOverlayProps = {
  messages: string[]
  mascotPose: MascotPose
  theme?: DialogueTheme
  startDelayMs?: number
  onDismiss: () => void
  onSkip?: () => void
  skipLabel?: string
}

// ── Main export ───────────────────────────────

export function DialogueOverlay({
  messages,
  mascotPose,
  theme = 'cream',
  startDelayMs = 0,
  onDismiss,
  onSkip,
  skipLabel,
}: DialogueOverlayProps): ReactNode {
  const [ready, setReady] = useState(false)
  const [messageIndex, setMessageIndex] = useState(0)
  const [charCount, setCharCount] = useState(0)
  const dialogRef = useRef<HTMLDivElement>(null)
  const bubbleRef = useRef<HTMLDivElement>(null)
  const styles = THEME_STYLES[theme]

  const currentMessage = messages[messageIndex] ?? ''
  const isTypingCurrent = charCount < currentMessage.length
  const allDone = messageIndex >= messages.length - 1 && !isTypingCurrent
  const isTyping = !allDone

  useEffect(() => {
    dialogRef.current?.focus()
    if (startDelayMs <= 0) {
      setReady(true)
      return
    }
    const delay = setTimeout((): void => setReady(true), startDelayMs)
    return (): void => {
      clearTimeout(delay)
    }
  }, [startDelayMs])

  // Typewriter + auto-advance: type each message, then pause and advance
  useEffect(() => {
    if (!ready) return
    if (isTypingCurrent) {
      const timer = setInterval(() => {
        setCharCount((prev) => Math.min(prev + 1, currentMessage.length))
      }, TYPEWRITER_SPEED_MS)
      return (): void => {
        clearInterval(timer)
      }
    }
    if (messageIndex < messages.length - 1) {
      const pause = setTimeout((): void => {
        setMessageIndex((prev) => prev + 1)
        setCharCount(0)
      }, 400)
      return (): void => {
        clearTimeout(pause)
      }
    }
    return
  }, [ready, isTypingCurrent, currentMessage.length, messageIndex, messages.length])

  useEffect(() => {
    if (bubbleRef.current?.scrollTo) {
      bubbleRef.current.scrollTo({ top: bubbleRef.current.scrollHeight, behavior: 'smooth' })
    }
  }, [messageIndex, charCount])

  // Skip reveals the current paragraph instantly; auto-advance handles the rest
  const handleSkipLine = useCallback((): void => {
    if (isTypingCurrent) {
      setCharCount(currentMessage.length)
    }
  }, [isTypingCurrent, currentMessage.length])

  if (messages.length === 0) return null

  return (
    <div
      ref={dialogRef}
      className={`${styles.card} rounded-2xl w-full max-w-md mx-auto relative h-[340px]`}
      role="dialog"
      aria-label="Tutorial dialogue"
      onKeyDown={(e): void => {
        if (e.key === 'Escape') onDismiss()
      }}
      tabIndex={-1}
    >
      {/* Speech bubble */}
      <div
        ref={bubbleRef}
        className="absolute top-4 right-4 bottom-14 left-[120px] bg-white rounded-2xl p-4 overflow-y-auto [scrollbar-gutter:stable] cursor-pointer [scrollbar-width:none] hover:[scrollbar-width:thin] [&::-webkit-scrollbar]:w-0 hover:[&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-warm-200 [&::-webkit-scrollbar-thumb]:rounded-full"
        onClick={isTyping ? handleSkipLine : undefined}
        data-testid="dialogue-bubble"
        role="presentation"
      >
        <div className="space-y-2.5" data-testid="dialogue-text">
          {messages.slice(0, messageIndex + 1).map((msg, i) => (
            <p key={i} className="text-text-primary text-sm leading-relaxed">
              {i < messageIndex ? msg : msg.slice(0, charCount)}
              {i === messageIndex && isTypingCurrent && (
                <span
                  className="inline-block w-0.5 h-3.5 bg-text-primary ml-0.5 animate-pulse align-text-bottom"
                  aria-hidden="true"
                />
              )}
            </p>
          ))}
        </div>
        {/* Speech bubble tail */}
        <div
          className="absolute -left-3 bottom-6 w-0 h-0 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-r-[12px] border-r-white"
          aria-hidden="true"
        />
      </div>

      {/* Mascot */}
      <img
        src={MASCOT_IMAGES[mascotPose]}
        alt=""
        aria-hidden="true"
        className="absolute bottom-3 left-3 w-[100px] h-[130px] object-contain"
        data-testid="mascot-image"
      />

      {/* Action buttons */}
      <div className="absolute bottom-3.5 right-4 flex items-center gap-2">
        {isTyping ? (
          <button
            type="button"
            onClick={handleSkipLine}
            className={`px-3 py-2.5 text-xs font-bold rounded-lg ${styles.skipBg} ${styles.skipText} ${styles.skipShadow} hover:brightness-105 active:translate-y-[2px] active:shadow-none transition-all duration-75`}
          >
            Skip
          </button>
        ) : (
          <>
            {onSkip && (
              <button
                type="button"
                onClick={onSkip}
                className={`px-3 py-2.5 text-xs font-bold rounded-lg ${styles.skipBg} ${styles.skipText} ${styles.skipShadow} hover:brightness-105 active:translate-y-[2px] active:shadow-none transition-all duration-75`}
              >
                {skipLabel ?? 'Skip'}
              </button>
            )}
            <button
              type="button"
              onClick={onDismiss}
              className={`px-3 py-2.5 text-xs font-bold rounded-lg ${styles.gotItBg} text-white ${styles.gotItShadow} hover:brightness-105 active:translate-y-[2px] active:shadow-none transition-all duration-75`}
            >
              Got it
            </button>
          </>
        )}
      </div>
    </div>
  )
}
