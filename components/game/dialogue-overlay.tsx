// ─────────────────────────────────────────────
// File: components/game/dialogue-overlay.tsx
// Purpose: Dialogue card with mascot character and typewriter
//          text animation. Renders in place of the game window.
//          All messages flow continuously in a single scrollable
//          bubble. Fixed card height, mascot bottom-left, bubble
//          fills remaining space.
// Depends on: nothing
// ─────────────────────────────────────────────

'use client'

import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react'

// ── Constants ─────────────────────────────────

const TYPEWRITER_SPEED_MS = 50

const MASCOT_IMAGES: Record<MascotPose, string> = {
  neutral: '/images/mascot/mascot-neutral.png',
  encouraging: '/images/mascot/mascot-encouraging.png',
  thinking: '/images/mascot/mascot-thinking.png',
}

// ── Types ─────────────────────────────────────

export type MascotPose = 'neutral' | 'encouraging' | 'thinking'

type DialogueOverlayProps = {
  messages: string[]
  mascotPose: MascotPose
  onDismiss: () => void
}

// ── Main export ───────────────────────────────

export function DialogueOverlay({
  messages,
  mascotPose,
  onDismiss,
}: DialogueOverlayProps): ReactNode {
  const [messageIndex, setMessageIndex] = useState(0)
  const [charCount, setCharCount] = useState(0)
  const dialogRef = useRef<HTMLDivElement>(null)
  const bubbleRef = useRef<HTMLDivElement>(null)

  const currentMessage = messages[messageIndex] ?? ''
  const isTypingCurrent = charCount < currentMessage.length
  const allDone = messageIndex >= messages.length - 1 && !isTypingCurrent
  const isTyping = !allDone

  useEffect(() => {
    dialogRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!isTypingCurrent) {
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
    }
    const timer = setInterval(() => {
      setCharCount((prev) => Math.min(prev + 1, currentMessage.length))
    }, TYPEWRITER_SPEED_MS)
    return (): void => {
      clearInterval(timer)
    }
  }, [isTypingCurrent, currentMessage.length, messageIndex, messages.length])

  useEffect(() => {
    if (bubbleRef.current?.scrollTo) {
      bubbleRef.current.scrollTo({ top: bubbleRef.current.scrollHeight, behavior: 'smooth' })
    }
  }, [messageIndex, charCount])

  const skipAll = useCallback((): void => {
    setMessageIndex(messages.length - 1)
    setCharCount(messages[messages.length - 1]?.length ?? 0)
  }, [messages])

  if (messages.length === 0) return null

  return (
    <div
      ref={dialogRef}
      className="bg-[#faf5e4] rounded-2xl shadow-[0_6px_0_0_#d4c9b0] w-full max-w-md mx-auto relative h-[340px]"
      role="dialog"
      aria-label="Tutorial dialogue"
      onKeyDown={(e): void => {
        if (e.key === 'Escape') onDismiss()
      }}
      tabIndex={-1}
    >
      {/* Speech bubble - right side, fills most of the card */}
      <div
        ref={bubbleRef}
        className="absolute top-4 right-4 bottom-14 left-[120px] bg-white rounded-2xl p-4 overflow-y-auto [scrollbar-gutter:stable] cursor-pointer [scrollbar-width:none] hover:[scrollbar-width:thin] [&::-webkit-scrollbar]:w-0 hover:[&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-warm-200 [&::-webkit-scrollbar-thumb]:rounded-full"
        onClick={isTyping ? skipAll : undefined}
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
        {/* Speech bubble tail - points left toward mascot */}
        <div
          className="absolute -left-3 bottom-6 w-0 h-0 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-r-[12px] border-r-white"
          aria-hidden="true"
        />
      </div>

      {/* Mascot - bottom left */}
      <img
        src={MASCOT_IMAGES[mascotPose]}
        alt=""
        aria-hidden="true"
        className="absolute bottom-3 left-3 w-[100px] h-[130px] object-contain"
        data-testid="mascot-image"
      />

      {/* Action button - bottom right */}
      <div className="absolute bottom-3.5 right-4">
        {isTyping ? (
          <button
            type="button"
            onClick={skipAll}
            className="px-3 py-2.5 text-xs font-bold rounded-lg bg-warm-200 text-warm-600 shadow-[0_3px_0_0_#b8a898] hover:brightness-105 active:translate-y-[2px] active:shadow-none transition-all duration-75"
          >
            Skip
          </button>
        ) : (
          <button
            type="button"
            onClick={onDismiss}
            className="px-3 py-2.5 text-xs font-bold rounded-lg bg-sage-500 text-white shadow-[0_3px_0_0_#456e3d] hover:brightness-105 active:translate-y-[2px] active:shadow-none transition-all duration-75"
          >
            Got it
          </button>
        )}
      </div>
    </div>
  )
}
