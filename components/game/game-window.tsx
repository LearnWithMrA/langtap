// ─────────────────────────────────────────────
// File: components/game/game-window.tsx
// Purpose: Floating game card containing the word prompt,
//          input area (varies by mode), and feedback elements.
//          The full word is shown with characters dimming as the
//          user types through them. All characters flash green on
//          word completion. Wired to the real engine via
//          usePracticeSession hook.
// Depends on: hooks/usePracticeSession.ts, engine/input.ts,
//             engine/constants.ts,
//             components/game/type-input.tsx,
//             components/game/swipe-input.tsx,
//             components/game/tap-input.tsx,
//             components/game/meaning-reveal.tsx
// ─────────────────────────────────────────────

'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import type { ReactNode } from 'react'
import { TypeInput } from '@/components/game/type-input'
import { SwipeInput } from '@/components/game/swipe-input'
import { TapInput } from '@/components/game/tap-input'
import { MeaningReveal } from '@/components/game/meaning-reveal'
import { FEEDBACK_FLASH_MS, MEANING_DISPLAY_MS, MEANING_FADE_MS } from '@/engine/constants'
import { evaluateInput } from '@/engine/input'
import { toKatakana } from '@/fixtures/kana-practice-data'
import { KANA_CHARACTERS } from '@/data/kana/characters'
import { getDualMnemonic } from '@/data/kana/mnemonics'
import { useSettingsStore } from '@/stores/settings.store'
import { useWordAudio } from '@/hooks/useWordAudio'
import { getWordAudioPath } from '@/data/audio/word-manifest'
import type { Stage } from '@/types/kana.types'
import type {
  UsePracticeSessionReturn,
  CharacterResult,
  PracticeCharacter,
} from '@/hooks/usePracticeSession'

const MAX_WRONG_ATTEMPTS = 3
const TAP_GRID_SIZE = 10

// ── Types ─────────────────────────────────────

type InputMode = 'type' | 'tap' | 'swipe'

type LeaderboardAttempt = { charIndex: number; submitted: string }

type GameWindowProps = {
  mode: InputMode
  session: UsePracticeSessionReturn
  onCharacterCorrect?: (characterCount: number) => void
  onMnemonicShown?: () => void
  onLeaderboardStart?: (promptId: string, wordId: string) => void
  onLeaderboardFinalize?: (promptId: string, attempts: LeaderboardAttempt[]) => void
  allowedCharIds?: Set<string>
  cardClassName?: string
  children?: ReactNode
}

// ── Helpers ───────────────────────────────────

function isKatakanaChar(kana: string): boolean {
  const code = kana.charCodeAt(0)
  return code >= 0x30a0 && code <= 0x30ff
}

function buildTapGrid(
  wordChars: PracticeCharacter[],
  isKatakana: boolean,
  allowedIds?: Set<string>,
): { id: string; kana: string; romaji: string }[] {
  const requiredIds = new Set(wordChars.map((c) => c.id))
  const required = wordChars.filter((c, i, arr) => arr.findIndex((x) => x.id === c.id) === i)

  const needed = TAP_GRID_SIZE - required.length
  const script = isKatakana ? 'katakana' : 'hiragana'

  const SPECIALS = new Set(['h-sokuon', 'k-sokuon', 'k-longvowel'])

  const basePool = allowedIds
    ? KANA_CHARACTERS.filter(
        (c) =>
          allowedIds.has(c.id) &&
          c.romaji !== '' &&
          !requiredIds.has(c.id) &&
          !SPECIALS.has(c.id) &&
          c.script === script,
      )
    : KANA_CHARACTERS.filter((c) => {
        const wordStages = new Set(
          wordChars
            .map((wc) => KANA_CHARACTERS.find((k) => k.id === wc.id)?.stage)
            .filter((s): s is Stage => s !== undefined),
        )
        return (
          c.script === script &&
          c.romaji !== '' &&
          !requiredIds.has(c.id) &&
          !SPECIALS.has(c.id) &&
          wordStages.has(c.stage)
        )
      })

  const shuffled = [...basePool].sort(() => Math.random() - 0.5)
  const distractors = shuffled.slice(0, needed)

  if (distractors.length < needed) {
    const usedIds = new Set([...requiredIds, ...distractors.map((c) => c.id)])
    const fallbackSource = allowedIds
      ? KANA_CHARACTERS.filter(
          (c) =>
            allowedIds.has(c.id) &&
            c.script === script &&
            c.romaji !== '' &&
            !usedIds.has(c.id) &&
            !SPECIALS.has(c.id),
        )
      : KANA_CHARACTERS.filter(
          (c) =>
            c.script === script && c.romaji !== '' && !usedIds.has(c.id) && !SPECIALS.has(c.id),
        )
    const shuffledFallback = [...fallbackSource].sort(() => Math.random() - 0.5)
    distractors.push(...shuffledFallback.slice(0, needed - distractors.length))
  }

  const grid = [
    ...required.map((c) => ({ id: c.id, kana: c.kana, romaji: c.romaji })),
    ...distractors.map((c) => ({ id: c.id, kana: c.kana, romaji: c.romaji })),
  ]

  return grid.sort(() => Math.random() - 0.5)
}

// ── Component ─────────────────────────────────

export function GameWindow({
  mode,
  session,
  onCharacterCorrect,
  onMnemonicShown,
  onLeaderboardStart,
  onLeaderboardFinalize,
  allowedCharIds,
  cardClassName,
  children,
}: GameWindowProps): ReactNode {
  const childArray = Array.isArray(children) ? children : children ? [children] : []
  const topLeft = childArray[0] ?? null
  const topRight = childArray[1] ?? null

  const { prompt, isLoading, isEmpty, handleWordComplete, advanceToNext } = session

  const inputDirection = useSettingsStore((s) => s.inputDirection)
  const hintsEnabled = useSettingsStore((s) => s.hints)
  const { playWordAudio, playKanaAudio } = useWordAudio()

  type Direction = 'kana-to-romaji' | 'romaji-to-kana'
  const [alternateDirection, setAlternateDirection] = useState<Direction>('kana-to-romaji')
  const direction: Direction =
    inputDirection === 'alternate'
      ? alternateDirection
      : inputDirection === 'romaji-to-kana'
        ? 'romaji-to-kana'
        : 'kana-to-romaji'
  const [inputValue, setInputValue] = useState('')
  const [completedCount, setCompletedCount] = useState(0)
  const [feedbackState, setFeedbackState] = useState<'idle' | 'correct' | 'wrong'>('idle')
  const [wrongAttemptsMap, setWrongAttemptsMap] = useState<number[]>([])
  const [charStartTimes, setCharStartTimes] = useState<number[]>([])

  const [showMeaning, setShowMeaning] = useState(false)
  const [wordDone, setWordDone] = useState(false)
  const [tapFeedbackId, setTapFeedbackId] = useState<string | null>(null)
  const [tapFeedbackState, setTapFeedbackState] = useState<'correct' | 'wrong' | null>(null)

  const generationRef = useRef(0)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const promptIdRef = useRef('')
  const firstAttemptsRef = useRef<string[]>([])

  const characters = useMemo(() => prompt?.characters ?? [], [prompt])
  const isKatakana = characters.length > 0 && isKatakanaChar(characters[0].kana)
  const isKanaToRomaji = direction === 'kana-to-romaji'
  const currentCharIndex = Math.min(completedCount, characters.length - 1)
  const currentChar = characters[currentCharIndex]

  const isCharacterDrill = prompt?.kind === 'character'
  const currentRomaji = characters[0]?.romaji ?? ''
  const dualMnemonic = isCharacterDrill && hintsEnabled ? getDualMnemonic(currentRomaji) : null

  const startRef = useRef(onLeaderboardStart)
  startRef.current = onLeaderboardStart

  const tapGrid = useMemo(
    () => (characters.length > 0 ? buildTapGrid(characters, isKatakana, allowedCharIds) : []),
    [characters, isKatakana, allowedCharIds],
  )

  // Cumulative breakpoints
  const romajiBreakpoints = useMemo((): string[] => {
    const result: string[] = []
    let cumulative = ''
    for (const char of characters) {
      cumulative += char.romaji
      result.push(cumulative)
    }
    return result
  }, [characters])

  const kanaBreakpoints = useMemo((): string[] => {
    const result: string[] = []
    let cumulative = ''
    for (const char of characters) {
      cumulative += char.kana
      result.push(cumulative)
    }
    return result
  }, [characters])

  const breakpoints = isKanaToRomaji ? romajiBreakpoints : kanaBreakpoints
  const fullAnswer = breakpoints[breakpoints.length - 1] ?? ''

  function getWrongAttempts(charIdx: number): number {
    return wrongAttemptsMap[charIdx] ?? 0
  }
  const showHintForChar = (charIdx: number): boolean =>
    getWrongAttempts(charIdx) >= MAX_WRONG_ATTEMPTS

  const mnemonicVisible = dualMnemonic !== null && showHintForChar(0)
  const mnemonicFiredRef = useRef(false)
  useEffect(() => {
    if (mnemonicVisible && !mnemonicFiredRef.current) {
      mnemonicFiredRef.current = true
      onMnemonicShown?.()
    }
  }, [mnemonicVisible, onMnemonicShown])

  useEffect(() => {
    mnemonicFiredRef.current = false
  }, [prompt])

  const clearTimers = useCallback((): void => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
  }, [])

  const scheduleTimeout = useCallback((fn: () => void, ms: number): void => {
    const gen = generationRef.current
    const id = setTimeout((): void => {
      if (gen === generationRef.current) fn()
    }, ms)
    timersRef.current.push(id)
  }, [])

  const resetInputState = useCallback((): void => {
    generationRef.current++
    clearTimers()
    setInputValue('')
    setCompletedCount(0)
    setWrongAttemptsMap([])
    setCharStartTimes([Date.now()])
    setWordDone(false)
    setFeedbackState('idle')
    setShowMeaning(false)
    setTapFeedbackId(null)
    setTapFeedbackState(null)
  }, [clearTimers])

  // Reset on new prompt or mode change
  useEffect((): void => {
    resetInputState()
    if (prompt?.kind === 'word' && prompt.word.id) {
      const id = crypto.randomUUID()
      promptIdRef.current = id
      firstAttemptsRef.current = new Array(prompt.characters.length).fill('')
      startRef.current?.(id, prompt.word.id)
    }
  }, [prompt, mode, resetInputState])

  useEffect((): (() => void) => {
    return clearTimers
  }, [clearTimers])

  // Build character results for scoring
  const buildResults = useCallback((): CharacterResult[] => {
    const now = Date.now()
    return characters.map((char, i) => ({
      characterId: char.id,
      isFirstAttemptCorrect: (wrongAttemptsMap[i] ?? 0) === 0,
      responseTimeMs: now - (charStartTimes[i] ?? now),
    }))
  }, [characters, wrongAttemptsMap, charStartTimes])

  const onWordComplete = useCallback((): void => {
    clearTimers()
    generationRef.current++
    setWordDone(true)
    setCompletedCount(characters.length)
    setFeedbackState('correct')

    const results = buildResults()
    handleWordComplete(results)
    onCharacterCorrect?.(characters.length)

    if (!isCharacterDrill && onLeaderboardFinalize) {
      const attempts = firstAttemptsRef.current.map((submitted, i) => ({
        charIndex: i,
        submitted,
      }))
      onLeaderboardFinalize(promptIdRef.current, attempts)
    }

    scheduleTimeout((): void => {
      setShowMeaning(true)
      const wordId = prompt?.word.id
      if (wordId && getWordAudioPath(wordId)) {
        playWordAudio(wordId)
      } else {
        const kana = prompt?.characters[0]?.kana
        if (kana) playKanaAudio(kana)
      }
    }, MEANING_FADE_MS)
    scheduleTimeout((): void => {
      if (inputDirection === 'alternate') {
        setAlternateDirection((prev) =>
          prev === 'kana-to-romaji' ? 'romaji-to-kana' : 'kana-to-romaji',
        )
      }
      advanceToNext()
    }, MEANING_DISPLAY_MS)
  }, [
    clearTimers,
    scheduleTimeout,
    characters.length,
    buildResults,
    handleWordComplete,
    onCharacterCorrect,
    onLeaderboardFinalize,
    isCharacterDrill,
    advanceToNext,
    inputDirection,
    playWordAudio,
    playKanaAudio,
    prompt?.word.id,
    prompt?.characters,
  ])

  const recordFirstAttempt = useCallback((charIdx: number, submitted: string): void => {
    if (firstAttemptsRef.current[charIdx] === '') {
      firstAttemptsRef.current[charIdx] = submitted
    }
  }, [])

  const handleWrong = useCallback((): void => {
    clearTimers()
    generationRef.current++
    setWrongAttemptsMap((prev) => {
      const next = [...prev]
      while (next.length <= currentCharIndex) next.push(0)
      next[currentCharIndex] = (next[currentCharIndex] ?? 0) + 1
      return next
    })
    setFeedbackState('wrong')

    scheduleTimeout((): void => {
      setFeedbackState('idle')
      setTapFeedbackId(null)
      setTapFeedbackState(null)
    }, FEEDBACK_FLASH_MS)
  }, [clearTimers, scheduleTimeout, currentCharIndex])

  // Type/Swipe: cumulative input evaluation using tri-state
  const handleInputChange = useCallback(
    (value: string): void => {
      if (wordDone || !prompt) return

      const cleaned = value.replace(/\u200b/g, '')
      let compare = isKanaToRomaji ? cleaned.toLowerCase() : cleaned
      if (!isKanaToRomaji && isKatakana) {
        compare = toKatakana(compare)
      }

      setInputValue(value)

      const match = evaluateInput(compare, fullAnswer)

      if (match === 'no_match') {
        const prevBp = completedCount > 0 ? breakpoints[completedCount - 1] : ''
        const segment = compare.substring(prevBp.length)
        recordFirstAttempt(completedCount, segment)
        handleWrong()
        return
      }

      if (feedbackState === 'wrong') {
        setFeedbackState('idle')
      }

      // Update completed count based on breakpoints passed
      let newCompleted = 0
      for (const bp of breakpoints) {
        if (compare.length >= bp.length && compare.substring(0, bp.length) === bp) {
          newCompleted++
        }
      }

      // Record first attempts for newly completed characters
      if (newCompleted > completedCount) {
        for (let idx = completedCount; idx < newCompleted; idx++) {
          const prevBp = idx > 0 ? breakpoints[idx - 1] : ''
          const nextBp = breakpoints[idx]
          const segment = compare.substring(prevBp.length, nextBp.length)
          recordFirstAttempt(idx, segment)
        }
        setCharStartTimes((prev) => {
          const next = [...prev]
          while (next.length <= newCompleted) next.push(Date.now())
          return next
        })
      }

      setCompletedCount(newCompleted)

      if (match === 'full_match') {
        onWordComplete()
      }
    },
    [
      fullAnswer,
      breakpoints,
      feedbackState,
      wordDone,
      prompt,
      isKanaToRomaji,
      isKatakana,
      completedCount,
      handleWrong,
      onWordComplete,
      recordFirstAttempt,
    ],
  )

  // Tap: character-by-character
  const handleTap = useCallback(
    (id: string, value: string): void => {
      if (wordDone || !currentChar) return
      setTapFeedbackId(id)
      const expected = isKanaToRomaji ? currentChar.romaji : currentChar.kana
      recordFirstAttempt(completedCount, value)
      if (value === expected) {
        setTapFeedbackState('correct')
        const newCompleted = completedCount + 1
        setCompletedCount(newCompleted)
        setCharStartTimes((prev) => {
          const next = [...prev]
          while (next.length <= newCompleted) next.push(Date.now())
          return next
        })

        if (newCompleted === characters.length) {
          onWordComplete()
        } else {
          clearTimers()
          generationRef.current++
          setFeedbackState('correct')
          scheduleTimeout((): void => {
            setFeedbackState('idle')
            setTapFeedbackId(null)
            setTapFeedbackState(null)
          }, FEEDBACK_FLASH_MS)
        }
      } else {
        setTapFeedbackState('wrong')
        handleWrong()
      }
    },
    [
      currentChar,
      isKanaToRomaji,
      completedCount,
      characters.length,
      wordDone,
      handleWrong,
      onWordComplete,
      clearTimers,
      scheduleTimeout,
      recordFirstAttempt,
    ],
  )

  // Character colour
  const WRONG_COLOURS = ['text-[#f5c490]', 'text-[#f5ac6a]', 'text-feedback-wrong']

  function charColour(index: number): string {
    if (showMeaning || (feedbackState === 'correct' && completedCount === characters.length)) {
      return 'text-feedback-correct'
    }
    const charWrong = getWrongAttempts(index)
    if (index >= completedCount && charWrong > 0) {
      return WRONG_COLOURS[Math.min(charWrong - 1, WRONG_COLOURS.length - 1)]
    }
    if (index < completedCount) return 'text-feedback-correct'
    return 'text-warm-800'
  }

  // ── Loading and empty states ──────────────────

  if (isLoading || isEmpty || !prompt) {
    return null
  }

  // ── Render ────────────────────────────────────

  return (
    <div
      data-testid="practice-game-ready"
      className={`${cardClassName ?? 'bg-[#faf5e4] shadow-[0_6px_0_0_#d4c9b0]'} rounded-2xl w-full max-w-md mx-auto p-6 md:p-8`}
    >
      {(topLeft || topRight) && (
        <div className="flex items-center justify-between mb-2 -mt-2">
          {topLeft}
          {topRight}
        </div>
      )}

      <div className="text-5xl md:text-6xl font-bold text-center py-1 select-none leading-tight">
        {characters.map((char, i) => {
          const displayText = isKanaToRomaji ? char.kana : char.romaji
          const hintText = isKanaToRomaji ? char.romaji : char.kana
          return (
            <span
              key={i}
              className={[
                'relative inline-block transition-colors duration-150',
                charColour(i),
              ].join(' ')}
            >
              {showHintForChar(i) && i >= completedCount && (
                <span
                  className={[
                    'absolute left-1/2 -translate-x-1/2 font-medium text-warm-400 whitespace-nowrap',
                    isKanaToRomaji ? '-top-5 text-lg' : '-top-4 text-2xl',
                  ].join(' ')}
                >
                  {hintText}
                </span>
              )}
              {displayText}
            </span>
          )
        })}
      </div>

      <MeaningReveal
        meaning={prompt.word.meaning}
        visible={showMeaning}
        mnemonic={dualMnemonic && showHintForChar(0) ? dualMnemonic.text : null}
        isCorrect={wordDone}
      />

      {mode === 'type' && (
        <div className="pt-3">
          <TypeInput
            value={inputValue}
            onChange={handleInputChange}
            feedbackState={feedbackState}
            disabled={wordDone}
            showKatakana={!isKanaToRomaji && isKatakana}
            keepKeyboardOpen
          />
          <p className="text-sm text-warm-400 text-center mt-2">
            This mode is for a computer keyboard
          </p>
        </div>
      )}

      {mode === 'swipe' && (
        <div className="pt-3">
          <SwipeInput
            value={inputValue}
            onChange={handleInputChange}
            feedbackState={feedbackState}
            disabled={wordDone}
            showKatakana={!isKanaToRomaji && isKatakana}
            keepKeyboardOpen
          />
          <p className="text-sm text-warm-400 text-center mt-2">
            This mode is for the mobile keyboard
          </p>
        </div>
      )}

      {mode === 'tap' && (
        <TapInput
          characters={tapGrid}
          displayField={isKanaToRomaji ? 'romaji' : 'kana'}
          onTap={handleTap}
          feedbackId={tapFeedbackId}
          feedbackState={tapFeedbackState}
        />
      )}
    </div>
  )
}
