// ------------------------------------------------------------
// File: hooks/useKeySound.ts
// Purpose: Web Audio API hook for keyboard-style sound effects.
//          Fetches individual sound files on demand and caches
//          decoded AudioBuffers per sound ID. Only the sounds
//          actually triggered get downloaded, so the initial
//          page load is not blocked by a large audio sprite.
//          Lazy init: AudioContext is created on first playSound
//          call to comply with browser autoplay policies.
//          Respects the keyClicks setting from settings.store.ts.
// Depends on: data/audio/key-sound-map.ts, stores/settings.store.ts
// ------------------------------------------------------------

'use client'

import { useCallback, useEffect, useRef } from 'react'
import { KEY_SOUND_MAP } from '@/data/audio/key-sound-map'
import { useSettingsStore } from '@/stores/settings.store'

// -- Module-level singletons --------------------------------

let sharedContext: AudioContext | null = null
const bufferCache = new Map<string, AudioBuffer>()
const loadingPromises = new Map<string, Promise<AudioBuffer | null>>()
let alternateIndex = 0
const ALTERNATE_SOUNDS = ['e', 'o']
let keySoundAudioSessionConfigured = false

function configureKeySoundAudioSession(): void {
  if (keySoundAudioSessionConfigured) return
  keySoundAudioSessionConfigured = true
  try {
    const nav = navigator as { audioSession?: { type: string } }
    if (nav.audioSession) {
      nav.audioSession.type = 'playback'
    }
  } catch {
    // Partial implementations may reject the assignment
  }
}

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
        configureKeySoundAudioSession()
        sharedContext = new AudioContext()
      }
      const response = await fetch(url)
      if (!response.ok) return null
      const arrayBuffer = await response.arrayBuffer()
      const buffer = await sharedContext.decodeAudioData(arrayBuffer)
      bufferCache.set(id, buffer)
      return buffer
    } catch {
      return null
    } finally {
      loadingPromises.delete(id)
    }
  })()

  loadingPromises.set(id, promise)
  return promise
}

// -- Warmup -------------------------------------------------

const WARMUP_SOUNDS = ['e', 'o', 'key-click']
let warmedUp = false

function warmupSounds(): void {
  if (warmedUp) return
  warmedUp = true
  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(() => {
      for (const id of WARMUP_SOUNDS) {
        void loadSound(id)
      }
    })
  } else {
    setTimeout(() => {
      for (const id of WARMUP_SOUNDS) {
        void loadSound(id)
      }
    }, 200)
  }
}

// -- Hook ---------------------------------------------------

export function useKeySound(): { playSound: (id: string) => void } {
  const mountedRef = useRef(true)
  const keyClicks = useSettingsStore((s) => s.keyClicks)

  useEffect((): (() => void) => {
    mountedRef.current = true
    if (keyClicks && !warmedUp) {
      const handler = (): void => {
        warmupSounds()
        document.removeEventListener('pointerdown', handler)
      }
      document.addEventListener('pointerdown', handler, { once: true })
      return (): void => {
        mountedRef.current = false
        document.removeEventListener('pointerdown', handler)
      }
    }
    return (): void => {
      mountedRef.current = false
    }
  }, [keyClicks])

  const playSound = useCallback((): void => {
    if (!keyClicks) return

    const soundId = ALTERNATE_SOUNDS[alternateIndex % ALTERNATE_SOUNDS.length]
    alternateIndex++

    const ctx = sharedContext
    const buf = bufferCache.get(soundId)
    if (!ctx || !buf) {
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
  }, [keyClicks])

  return { playSound }
}
