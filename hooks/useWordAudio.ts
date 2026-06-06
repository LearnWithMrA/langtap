// ─────────────────────────────────────────────
// File: hooks/useWordAudio.ts
// Purpose: On-demand pronunciation playback for words and
//          individual kana characters. Fetches and decodes MP3
//          audio only when play functions are called. Nothing
//          loads on page load. Respects the wordAudio setting
//          from settings.store.ts.
// Depends on: data/audio/word-manifest.ts,
//             data/audio/kana-manifest.ts,
//             stores/settings.store.ts
// ─────────────────────────────────────────────

'use client'

import { useCallback, useEffect } from 'react'
import { getWordAudioPath } from '@/data/audio/word-manifest'
import { getKanaAudioPath } from '@/data/audio/kana-manifest'
import { useSettingsStore } from '@/stores/settings.store'

// ── Module-level singletons ─────────────────

let ctx: AudioContext | null = null
const bufferCache = new Map<string, AudioBuffer>()
const pendingFetches = new Map<string, Promise<AudioBuffer | null>>()
let gestureUnlocked = false
let audioSessionConfigured = false

function configureAudioSession(): void {
  if (audioSessionConfigured) return
  audioSessionConfigured = true
  // iOS 16.4+: set audio session to 'playback' so Web Audio API
  // plays through the media channel, bypassing the silent switch.
  try {
    const nav = navigator as { audioSession?: { type: string } }
    if (nav.audioSession) {
      nav.audioSession.type = 'playback'
    }
  } catch {
    // Partial implementations may reject the assignment
  }
}

function getContext(): AudioContext {
  if (!ctx) {
    configureAudioSession()
    ctx = new AudioContext()
  }
  return ctx
}

function unlockAudioContext(): void {
  gestureUnlocked = true
  const audioCtx = getContext()
  if (audioCtx.state === 'suspended') {
    void audioCtx.resume()
  }
  document.removeEventListener('pointerdown', unlockAudioContext)
  document.removeEventListener('touchstart', unlockAudioContext)
}

function ensureGestureUnlock(): void {
  if (gestureUnlocked) return
  if (typeof document === 'undefined') return
  document.addEventListener('pointerdown', unlockAudioContext, { once: true })
  document.addEventListener('touchstart', unlockAudioContext, { once: true })
}

async function fetchAndDecode(path: string): Promise<AudioBuffer | null> {
  const cached = bufferCache.get(path)
  if (cached) return cached

  const pending = pendingFetches.get(path)
  if (pending) return pending

  const promise = (async (): Promise<AudioBuffer | null> => {
    try {
      const audioCtx = getContext()
      const response = await fetch(path)
      if (!response.ok) return null
      const arrayBuffer = await response.arrayBuffer()
      const buffer = await audioCtx.decodeAudioData(arrayBuffer)
      bufferCache.set(path, buffer)
      return buffer
    } catch {
      return null
    } finally {
      pendingFetches.delete(path)
    }
  })()

  pendingFetches.set(path, promise)
  return promise
}

// ── Shared playback ─────────────────────────

function playBuffer(path: string): void {
  void fetchAndDecode(path).then(async (buffer) => {
    if (!buffer) return
    const audioCtx = getContext()
    if (audioCtx.state === 'suspended') {
      await audioCtx.resume()
    }
    const source = audioCtx.createBufferSource()
    source.buffer = buffer
    source.connect(audioCtx.destination)
    source.start(0)
  })
}

// ── Hook ─────────────────────────────────────

export function useWordAudio(): {
  playWordAudio: (wordId: string) => void
  playKanaAudio: (kana: string) => void
} {
  const wordAudio = useSettingsStore((s) => s.wordAudio)

  useEffect(() => {
    if (wordAudio) ensureGestureUnlock()
  }, [wordAudio])

  const playWordAudio = useCallback(
    (wordId: string): void => {
      if (!wordAudio) return
      const path = getWordAudioPath(wordId)
      if (!path) return
      playBuffer(path)
    },
    [wordAudio],
  )

  const playKanaAudio = useCallback(
    (kana: string): void => {
      if (!wordAudio) return
      const path = getKanaAudioPath(kana)
      if (!path) return
      playBuffer(path)
    },
    [wordAudio],
  )

  return { playWordAudio, playKanaAudio }
}
