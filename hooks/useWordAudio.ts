// ─────────────────────────────────────────────
// File: hooks/useWordAudio.ts
// Purpose: On-demand word pronunciation playback. Fetches and
//          decodes MP3 audio only when playWordAudio() is called.
//          Nothing loads on page load. Respects the wordAudio
//          setting from settings.store.ts. Shares a single
//          AudioContext with useKeySound via lazy init.
// Depends on: data/audio/word-manifest.ts,
//             stores/settings.store.ts
// ─────────────────────────────────────────────

'use client'

import { useCallback } from 'react'
import { getWordAudioPath } from '@/data/audio/word-manifest'
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

// ── Hook ─────────────────────────────────────

export function useWordAudio(): {
  playWordAudio: (wordId: string) => void
} {
  const wordAudio = useSettingsStore((s) => s.wordAudio)

  const playWordAudio = useCallback(
    (wordId: string): void => {
      if (!wordAudio) return

      const path = getWordAudioPath(wordId)
      if (!path) return

      void fetchAndDecode(path).then((buffer) => {
        if (!buffer) return
        const audioCtx = getContext()
        if (audioCtx.state === 'suspended') {
          void audioCtx.resume()
        }
        const source = audioCtx.createBufferSource()
        source.buffer = buffer
        source.connect(audioCtx.destination)
        source.start(0)
      })
    },
    [wordAudio],
  )

  return { playWordAudio }
}
