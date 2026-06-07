// ─────────────────────────────────────────────
// File: hooks/__tests__/syncTiming.test.ts
// Purpose: Verifies that flushDirty is called immediately after
//          each word completion in both kana and kotoba practice
//          hooks. Guards against regression to delayed-only sync.
// Depends on: hooks/usePracticeSession.ts,
//             hooks/useKotobaPracticeSession.ts
// ─────────────────────────────────────────────

// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

// ── Mocks ────────────────────────────────────

const mockFlushDirty = vi.fn()

vi.mock('@/components/performance/sync-manager', () => ({
  useSyncContext: (): { flushDirty: () => Promise<void> } => ({
    flushDirty: mockFlushDirty,
  }),
}))

function createMockStore(defaultState: Record<string, unknown>): unknown {
  const fn = (selector: (s: Record<string, unknown>) => unknown): unknown => selector(defaultState)
  fn.getState = (): Record<string, unknown> => defaultState
  fn.setState = vi.fn()
  fn.subscribe = vi.fn()
  return fn
}

vi.mock('@/stores/mastery.store', () => ({
  useMasteryStore: createMockStore({
    scores: {},
    learningScores: {},
    increment: vi.fn(),
    incrementLearning: vi.fn(),
    setEpoch: vi.fn(),
    resetAll: vi.fn(),
  }),
}))

vi.mock('@/stores/word-mastery.store', () => ({
  useWordMasteryStore: createMockStore({
    scores: {},
    hasHydrated: true,
    manuallyUnlockedWords: [],
    increment: vi.fn(),
    setEpoch: vi.fn(),
    resetAll: vi.fn(),
  }),
}))

vi.mock('@/stores/counter.store', () => ({
  useCounterStore: createMockStore({
    counters: {},
    increment: vi.fn(),
    bulkLoad: vi.fn(),
    resetAll: vi.fn(),
  }),
}))

vi.mock('@/stores/session.store', () => ({
  useSessionStore: createMockStore({
    distanceMetres: 0,
    startSession: vi.fn(),
    recordCorrect: vi.fn(),
    recordWrong: vi.fn(),
  }),
}))

vi.mock('@/stores/unlock.store', () => ({
  useUnlockStore: createMockStore({
    bootstrapped: true,
    unlockedIds: new Set(),
    recompute: vi.fn(),
  }),
}))

vi.mock('@/stores/onboarding.store', () => ({
  useOnboardingStore: createMockStore({
    jlptLevel: 'N5',
    selectedCharacterIds: ['h-a', 'h-i', 'h-u', 'h-e', 'h-o'],
  }),
}))

vi.mock('@/stores/user.store', () => ({
  useUserStore: createMockStore({
    profile: { jlptLevel: 'N5' },
  }),
}))

vi.mock('@/engine/selection', () => ({
  selectNextKanaPrompt: vi.fn().mockReturnValue(null),
}))

vi.mock('@/engine/scoring', () => ({
  evaluateCharacterAttempt: vi.fn().mockReturnValue(1),
}))

vi.mock('@/engine/distance', () => ({
  calculateDistanceIncrement: vi.fn().mockReturnValue(10),
}))

vi.mock('@/engine/practice-eligibility', () => ({
  getPracticeAvailableIds: vi.fn().mockReturnValue(new Set(['h-a'])),
  getWordEligibleIds: vi.fn().mockReturnValue(new Set()),
}))

vi.mock('@/engine/constants', () => ({
  MIN_ELIGIBLE_WORDS_FOR_MIXING: 10,
}))

vi.mock('@/data/kana/characters', () => ({
  KANA_CHARACTERS: [],
  getCharacterById: vi.fn().mockImplementation((id: string) => {
    const chars: Record<string, { id: string; kana: string; romaji: string }> = {
      'h-a': { id: 'h-a', kana: 'あ', romaji: 'a' },
      'h-ka': { id: 'h-ka', kana: 'か', romaji: 'ka' },
    }
    return chars[id] ?? null
  }),
}))

vi.mock('@/data/kana/progression-groups', () => ({
  PROGRESSION_GROUPS: [],
  UNLOCK_STEPS: [],
}))

vi.mock('@/data/words/word-bank-loader', () => ({
  preloadAllWordBanks: vi.fn().mockResolvedValue(undefined),
  getAllWordBanksSync: vi.fn().mockReturnValue(null),
  getWordBankSync: vi.fn().mockReturnValue([
    {
      id: 'w-test',
      kana: 'あか',
      kanji: null,
      meaning: 'red',
      jlptLevel: 'N5',
      characterIds: ['h-a', 'h-ka'],
    },
  ]),
  getKotobaLevelsSync: vi.fn().mockReturnValue([]),
  preloadWordBank: vi.fn().mockResolvedValue(undefined),
  preloadKotobaLevels: vi.fn().mockResolvedValue(undefined),
  loadWordBank: vi.fn().mockResolvedValue([]),
  loadKotobaLevels: vi.fn().mockResolvedValue([]),
}))

const MOCK_KOTOBA_PROMPT = {
  id: 'w-test',
  kana: 'あか',
  kanji: null,
  english: 'red',
  characters: [
    { kana: 'あ', romaji: 'a' },
    { kana: 'か', romaji: 'ka' },
  ],
}

vi.mock('@/engine/kotoba-selection', () => ({
  selectKotobaPrompt: vi.fn().mockReturnValue(MOCK_KOTOBA_PROMPT),
  selectNextKotobaWord: vi.fn().mockReturnValue({
    word: {
      id: 'w-test',
      kana: 'あか',
      kanji: null,
      meaning: 'red',
      jlptLevel: 'N5',
      characterIds: ['h-a', 'h-ka'],
    },
    updatedCounters: {},
  }),
  generateKotobaDistractors: vi.fn().mockReturnValue([]),
  buildKotobaPrompt: vi.fn().mockReturnValue(MOCK_KOTOBA_PROMPT),
}))

vi.mock('@/engine/kotoba-progression', () => ({
  getUnlockedKotobaWordIds: vi.fn().mockReturnValue([]),
  isKotobaStepUnlocked: vi.fn().mockReturnValue(true),
  getActiveKotobaStepIndex: vi.fn().mockReturnValue(0),
  JLPT_RANK: { N5: 5, N4: 4, N3: 3, N2: 2, N1: 1 },
}))

vi.mock('@/data/words/kotoba-dojo-data', () => ({
  KOTOBA_LEVELS: {},
  getKotobaWordById: vi.fn(),
  getAllKotobaWordIds: vi.fn().mockReturnValue([]),
  getKotobaKanjiBank: vi.fn().mockReturnValue([]),
}))

// ── Tests ────────────────────────────────────

describe('Sync timing: flushDirty on word completion', () => {
  beforeEach(() => {
    mockFlushDirty.mockClear()
  })

  it('usePracticeSession calls flushDirty after handleWordComplete', async () => {
    const { usePracticeSession } = await import('@/hooks/usePracticeSession')

    const { result } = renderHook(() => usePracticeSession('N5'))

    act(() => {
      result.current.handleWordComplete([
        { characterId: 'h-a', isFirstAttemptCorrect: true, responseTimeMs: 1000 },
      ])
    })

    expect(mockFlushDirty).toHaveBeenCalledTimes(1)
  })

  it('useKotobaPracticeSession calls flushDirty after recordWordComplete', async () => {
    const { useKotobaPracticeSession } = await import('@/hooks/useKotobaPracticeSession')

    const { result } = renderHook(() => useKotobaPracticeSession('N5'))

    act(() => {
      result.current.recordWordComplete(true, 1)
    })

    expect(mockFlushDirty).toHaveBeenCalledTimes(1)
  })

  it('flushDirty is non-blocking (void prefix pattern)', async () => {
    mockFlushDirty.mockReturnValue(new Promise(() => {}))

    const { usePracticeSession } = await import('@/hooks/usePracticeSession')
    const { result } = renderHook(() => usePracticeSession('N5'))

    act(() => {
      result.current.handleWordComplete([
        { characterId: 'h-a', isFirstAttemptCorrect: true, responseTimeMs: 500 },
      ])
    })

    expect(mockFlushDirty).toHaveBeenCalledTimes(1)
  })
})
