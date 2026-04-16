// ------------------------------------------------------------
// File: hooks/useKeySound.ts
// Purpose: Web Audio API hook for keyboard-style sound effects.
//          Loads a single audio sprite on first use and plays
//          slices by ID. Uses a module-level singleton so the
//          AudioContext and buffer are shared across all components.
//          Lazy init: AudioContext is created on first playSound
//          call to comply with browser autoplay policies.
// Depends on: data/audio/key-sound-map.ts
// ------------------------------------------------------------

'use client'

import { useCallback, useEffect, useRef } from 'react'
import { KEY_SOUND_MAP, SOUND_SPRITE_URL } from '@/data/audio/key-sound-map'

// -- Module-level singleton ---------------------------------

let sharedContext: AudioContext | null = null
let sharedBuffer: AudioBuffer | null = null
let loadingPromise: Promise<void> | null = null
let alternateIndex = 0
const ALTERNATE_SOUNDS = ['e', 'o']

async function ensureLoaded(): Promise<void> {
  if (sharedBuffer) return
  if (loadingPromise) {
    await loadingPromise
    return
  }

  loadingPromise = (async (): Promise<void> => {
    try {
      if (!sharedContext) {
        sharedContext = new AudioContext()
      }
      const response = await fetch(SOUND_SPRITE_URL)
      if (!response.ok) return
      const arrayBuffer = await response.arrayBuffer()
      sharedBuffer = await sharedContext.decodeAudioData(arrayBuffer)
    } catch {
      // Sound is optional. Keep UI interactive if loading fails.
    }
  })()

  await loadingPromise
}

// -- Hook ---------------------------------------------------

export function useKeySound(): { playSound: (id: string) => void } {
  const mountedRef = useRef(true)

  useEffect((): (() => void) => {
    mountedRef.current = true
    // Pre-load the sprite on mount
    void ensureLoaded()
    return (): void => {
      mountedRef.current = false
    }
  }, [])

  const playSound = useCallback((): void => {
    // Alternate between two sounds on every call
    const soundId = ALTERNATE_SOUNDS[alternateIndex % ALTERNATE_SOUNDS.length]
    alternateIndex++
    const slice = KEY_SOUND_MAP[soundId]
    if (!slice) return

    const ctx = sharedContext
    const buf = sharedBuffer
    if (!ctx || !buf) {
      // Not loaded yet, try lazy init
      void ensureLoaded()
      return
    }

    if (ctx.state === 'suspended') {
      void ctx.resume()
    }

    const [startMs, durationMs] = slice
    const source = ctx.createBufferSource()
    source.buffer = buf
    source.connect(ctx.destination)
    source.start(0, startMs / 1000, durationMs / 1000)
  }, [])

  return { playSound }
}
