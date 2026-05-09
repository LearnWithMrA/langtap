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

import { useCallback } from 'react'
import { getWordAudioPath } from '@/data/audio/word-manifest'
import { getKanaAudioPath } from '@/data/audio/kana-manifest'
import { useSettingsStore } from '@/stores/settings.store'

// ── Module-level singletons ─────────────────

let ctx: AudioContext | null = null
const bufferCache = new Map<string, AudioBuffer>()
const pendingFetches = new Map<string, Promise<AudioBuffer | null>>()

function getContext(): AudioContext {
  if (!ctx) ctx = new AudioContext()
  return ctx
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
