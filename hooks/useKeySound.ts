// ------------------------------------------------------------
// File: hooks/useKeySound.ts
// Purpose: Web Audio API hook for keyboard-style sound effects.
//          Fetches individual sound files on demand and caches
//          decoded AudioBuffers per sound ID. Only the sounds
//          actually triggered get downloaded, so the initial
//          page load is not blocked by a large audio sprite.
//          Lazy init: AudioContext is created on first playSound
//          call to comply with browser autoplay policies.
// Depends on: data/audio/key-sound-map.ts
// ------------------------------------------------------------

'use client'

import { useCallback, useEffect, useRef } from 'react'
import { KEY_SOUND_MAP } from '@/data/audio/key-sound-map'

// -- Module-level singletons --------------------------------

let sharedContext: AudioContext | null = null
const bufferCache = new Map<string, AudioBuffer>()
const loadingPromises = new Map<string, Promise<AudioBuffer | null>>()
let alternateIndex = 0
const ALTERNATE_SOUNDS = ['e', 'o']

async function loadSound(id: string): Promise<AudioBuffer | null> {
  const cached = bufferCache.get(id)
  if (cached) return cached

  const existing = loadingPromises.get(id)
  if (existing) return existing

  const url = KEY_SOUND_MAP[id]
  if (!url) return null

  const promise = (async (): Promise<AudioBuffer | null> => {
    try {
      if (!sharedContext) {
        sharedContext = new AudioContext()
      }
      const response = await fetch(url)
      if (!response.ok) return null
      const arrayBuffer = await response.arrayBuffer()
      const buffer = await sharedContext.decodeAudioData(arrayBuffer)
      bufferCache.set(id, buffer)
      return buffer
    } catch {
      // Sound is optional. Keep UI interactive if loading fails.
      return null
    } finally {
      loadingPromises.delete(id)
    }
  })()

  loadingPromises.set(id, promise)
  return promise
}

// -- Hook ---------------------------------------------------

export function useKeySound(): { playSound: (id: string) => void } {
  const mountedRef = useRef(true)

  useEffect((): (() => void) => {
    mountedRef.current = true
    return (): void => {
      mountedRef.current = false
    }
  }, [])

  const playSound = useCallback((): void => {
    // Alternate between two sounds on every call
    const soundId = ALTERNATE_SOUNDS[alternateIndex % ALTERNATE_SOUNDS.length]
    alternateIndex++

    const ctx = sharedContext
    const buf = bufferCache.get(soundId)
    if (!ctx || !buf) {
      // Not loaded yet. Kick off the fetch so the next call can play it.
      void loadSound(soundId)
      return
    }

    if (ctx.state === 'suspended') {
      void ctx.resume()
    }

    const source = ctx.createBufferSource()
    source.buffer = buf
    source.connect(ctx.destination)
    source.start(0)
  }, [])

  return { playSound }
}
