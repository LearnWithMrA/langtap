// @vitest-environment jsdom
// ─────────────────────────────────────────────
// File: hooks/__tests__/useWordAudio.test.ts
// Purpose: Tests for useWordAudio hook. Validates that audio
//          is never fetched on mount, respects wordAudio setting,
//          and returns early for unknown word IDs.
// Depends on: hooks/useWordAudio.ts,
//             data/audio/word-manifest.ts,
//             stores/settings.store.ts
// ─────────────────────────────────────────────

import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useSettingsStore } from '@/stores/settings.store'

// ── Mocks ─────────────────────────────────────

const mockGetWordAudioPath = vi.fn()

vi.mock('@/data/audio/word-manifest', () => ({
  getWordAudioPath: (...args: unknown[]): unknown => mockGetWordAudioPath(...args),
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

const mockDecodeAudioData = vi.fn().mockResolvedValue({})
const mockConnect = vi.fn()
const mockStart = vi.fn()

global.AudioContext = vi.fn().mockImplementation(() => ({
  state: 'running',
  resume: vi.fn().mockResolvedValue(undefined),
  decodeAudioData: mockDecodeAudioData,
  destination: {},
  createBufferSource: vi.fn().mockReturnValue({
    connect: mockConnect,
    start: mockStart,
    buffer: null,
  }),
})) as unknown as typeof AudioContext

// ── Tests ─────────────────────────────────────

describe('useWordAudio', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    useSettingsStore.setState({ wordAudio: true })
    mockGetWordAudioPath.mockReturnValue(null)
  })

  it('does not fetch audio on mount', async () => {
    const { useWordAudio } = await import('../useWordAudio')
    renderHook(() => useWordAudio())

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('does not fetch when wordAudio setting is disabled', async () => {
    useSettingsStore.setState({ wordAudio: false })
    mockGetWordAudioPath.mockReturnValue('/audio/words/n5/123.mp3')

    const { useWordAudio } = await import('../useWordAudio')
    const { result } = renderHook(() => useWordAudio())

    act(() => {
      result.current.playWordAudio('123')
    })

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('does not fetch for unknown word IDs', async () => {
    useSettingsStore.setState({ wordAudio: true })
    mockGetWordAudioPath.mockReturnValue(null)

    const { useWordAudio } = await import('../useWordAudio')
    const { result } = renderHook(() => useWordAudio())

    act(() => {
      result.current.playWordAudio('unknown-id')
    })

    expect(mockGetWordAudioPath).toHaveBeenCalledWith('unknown-id')
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('fetches audio when setting enabled and word ID exists', async () => {
    useSettingsStore.setState({ wordAudio: true })
    mockGetWordAudioPath.mockReturnValue('/audio/words/n5/1198180.mp3')
    mockFetch.mockResolvedValue({
      ok: true,
      arrayBuffer: (): Promise<ArrayBuffer> => Promise.resolve(new ArrayBuffer(8)),
    })

    const { useWordAudio } = await import('../useWordAudio')
    const { result } = renderHook(() => useWordAudio())

    act(() => {
      result.current.playWordAudio('1198180')
    })

    await vi.waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/audio/words/n5/1198180.mp3')
    })
    expect(mockGetWordAudioPath).toHaveBeenCalledWith('1198180')
  })

  it('does not re-fetch after disabling setting', async () => {
    useSettingsStore.setState({ wordAudio: false })

    const { useWordAudio } = await import('../useWordAudio')
    const { result } = renderHook(() => useWordAudio())

    act(() => {
      result.current.playWordAudio('1198180')
    })

    expect(mockFetch).not.toHaveBeenCalled()
  })
})
