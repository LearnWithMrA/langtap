// ------------------------------------------------------------
// File: hooks/useEasterEgg.ts
// Purpose: Tracks the last 7 keydown characters and fires
//          when "langtap" is typed in sequence. Does not fire
//          when focus is inside an input, textarea, or
//          contenteditable element. Plays easter-egg-click.wav
//          and returns isActive state for logo animation.
// Depends on: nothing
// ------------------------------------------------------------

'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

// -- Constants ----------------------------------------------

const TRIGGER_WORD = 'langtap'
const HOLD_DURATION_MS = 4000

// -- Hook ---------------------------------------------------

export function useEasterEgg(): { isActive: boolean } {
  const [isActive, setIsActive] = useState(false)
  const bufferRef = useRef('')
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const activate = useCallback((): void => {
    setIsActive(true)
    const audio = new Audio('/sounds/Keyboard%20Click.mp3')
    audio.volume = 0.7
    audio.play().catch(() => {
      // Sound file may not exist yet
    })
    timeoutRef.current = setTimeout(() => {
      setIsActive(false)
    }, HOLD_DURATION_MS)
  }, [])

  useEffect((): (() => void) => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      // Skip if focus is inside an input field
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return
      }

      // Only track single printable characters
      if (e.key.length !== 1) return

      bufferRef.current = (bufferRef.current + e.key.toLowerCase()).slice(-TRIGGER_WORD.length)

      if (bufferRef.current === TRIGGER_WORD) {
        bufferRef.current = ''
        activate()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [activate])

  return { isActive }
}
