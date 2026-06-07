// ─────────────────────────────────────────────
// File: hooks/useLofiPlayer.ts
// Purpose: Shuffled lo-fi background music player. Tracks play
//          in random order, advancing automatically when one ends.
//          Audio is only fetched when the user clicks play. Nothing
//          loads on page load. Persists play/pause preference to
//          localStorage so it resumes on next visit.
// Depends on: data/audio/lofi-tracks.ts
// ─────────────────────────────────────────────

'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { LOFI_TRACKS, type LofiTrack } from '@/data/audio/lofi-tracks'

// ── Helpers ──────────────────────────────────

const STORAGE_KEY = 'langtap-lofi-playing'
const VOLUME_KEY = 'langtap-lofi-volume'
const DEFAULT_VOLUME = 0.3

function readPreference(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(STORAGE_KEY) === 'true'
}

function writePreference(playing: boolean): void {
  localStorage.setItem(STORAGE_KEY, String(playing))
}

function readVolume(): number {
  if (typeof window === 'undefined') return DEFAULT_VOLUME
  const stored = localStorage.getItem(VOLUME_KEY)
  if (!stored) return DEFAULT_VOLUME
  const parsed = parseFloat(stored)
  if (Number.isNaN(parsed) || parsed < 0 || parsed > 1) return DEFAULT_VOLUME
  return parsed
}

function writeVolume(vol: number): void {
  localStorage.setItem(VOLUME_KEY, String(vol))
}

function shuffleArray<T>(arr: readonly T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

// ── Hook ─────────────────────────────────────

export function useLofiPlayer(): {
  isPlaying: boolean
  currentTrack: LofiTrack | null
  volume: number
  toggle: () => void
  skip: () => void
  previous: () => void
  setVolume: (vol: number) => void
} {
  const [isPlaying, setIsPlaying] = useState(false)
  const [trackIndex, setTrackIndex] = useState(0)
  const [volume, setVolumeState] = useState(DEFAULT_VOLUME)
  const queueRef = useRef<LofiTrack[]>(shuffleArray(LOFI_TRACKS))
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const gainRef = useRef<GainNode | null>(null)
  const ctxRef = useRef<AudioContext | null>(null)
  const initializedRef = useRef(false)

  const currentTrack = isPlaying ? (queueRef.current[trackIndex] ?? null) : null

  const advanceToNext = useCallback((): void => {
    setTrackIndex((prev) => {
      const next = prev + 1
      if (next >= queueRef.current.length) {
        queueRef.current = shuffleArray(LOFI_TRACKS)
        return 0
      }
      return next
    })
  }, [])

  const setVolume = useCallback((vol: number): void => {
    const clamped = Math.max(0, Math.min(1, vol))
    setVolumeState(clamped)
    writeVolume(clamped)
    if (gainRef.current) {
      gainRef.current.gain.value = clamped
    }
  }, [])

  const playTrack = useCallback(
    (index: number): void => {
      const track = queueRef.current[index]
      if (!track) return

      if (!audioRef.current) {
        const audio = new Audio()
        audio.crossOrigin = 'anonymous'
        audio.addEventListener('ended', () => advanceToNext())
        audioRef.current = audio

        try {
          const ctx = new AudioContext()
          const source = ctx.createMediaElementSource(audio)
          const gain = ctx.createGain()
          gain.gain.value = readVolume()
          source.connect(gain)
          gain.connect(ctx.destination)
          ctxRef.current = ctx
          gainRef.current = gain
        } catch {
          audio.volume = readVolume()
        }
      }

      if (ctxRef.current?.state === 'suspended') {
        void ctxRef.current.resume()
      }

      const audio = audioRef.current
      audio.src = track.path
      void audio.play()
    },
    [advanceToNext],
  )

  useEffect(() => {
    if (isPlaying) {
      playTrack(trackIndex)
    }
  }, [trackIndex, isPlaying, playTrack])

  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true
    setVolumeState(readVolume())
    if (readPreference()) {
      const handler = (): void => {
        setIsPlaying(true)
        document.removeEventListener('pointerdown', handler)
      }
      document.addEventListener('pointerdown', handler, { once: true })
    }
  }, [])

  const toggle = useCallback((): void => {
    setIsPlaying((prev) => {
      const next = !prev
      writePreference(next)
      if (!next && audioRef.current) {
        audioRef.current.pause()
      }
      return next
    })
  }, [])

  const skip = useCallback((): void => {
    if (isPlaying) advanceToNext()
  }, [isPlaying, advanceToNext])

  const previous = useCallback((): void => {
    if (!isPlaying) return
    setTrackIndex((prev) => {
      if (prev <= 0) return queueRef.current.length - 1
      return prev - 1
    })
  }, [isPlaying])

  return { isPlaying, currentTrack, volume, toggle, skip, previous, setVolume }
}
