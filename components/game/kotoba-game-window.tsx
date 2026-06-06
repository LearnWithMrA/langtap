// ─────────────────────────────────────────────
// File: components/game/kotoba-game-window.tsx
// Purpose: Kotoba (vocabulary) practice game window. Built from
//          scratch for Kotoba flows, not derived from the Kana
//          game window.
//          Readings: show kanji, user taps/types kana reading,
//          furigana fills above the kanji as characters are entered.
//          Kanji: show English + row of 4 kanji options, user enters
//          kana reading then taps the correct kanji.
// Depends on: engine/constants.ts,
//             hooks/useKotobaPracticeSession.ts,
//             components/game/type-input.tsx,
//             components/game/swipe-input.tsx,
//             components/game/tap-input.tsx
// ─────────────────────────────────────────────

'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import type { ReactNode } from 'react'
import { TypeInput } from '@/components/game/type-input'
import { SwipeInput } from '@/components/game/swipe-input'
import { TapInput } from '@/components/game/tap-input'
import { FEEDBACK_FLASH_MS, KOTOBA_DISPLAY_MS, KANJI_INPUT_MULTIPLIER } from '@/engine/constants'
import {
  isKatakanaChar,
  KOTOBA_HIRAGANA_TAP,
  KOTOBA_KATAKANA_TAP,
} from '@/components/game/tap-grids'
import { useKeySound } from '@/hooks/useKeySound'
import { useWordAudio } from '@/hooks/useWordAudio'
import { getWordAudioPath } from '@/data/audio/word-manifest'
import { useSettingsStore } from '@/stores/settings.store'
import {
  useKotobaPracticeSession,
  type UseKotobaPracticeReturn,
} from '@/hooks/useKotobaPracticeSession'
import type { KotobaPrompt } from '@/types/kotoba.types'
import type { JlptLevel } from '@/types/user.types'

// ── Constants ─────────────────────────────────

const MAX_WRONG_ATTEMPTS = 3

// ── Types ─────────────────────────────────────

type InputMode = 'type' | 'tap' | 'swipe'
type KotobaInputSetting = 'readings' | 'kanji'

type Props = {
  mode: InputMode
  kotobaInput: KotobaInputSetting
  jlptLevel?: JlptLevel
  session?: UseKotobaPracticeReturn
  cardClassName?: string
  children?: ReactNode
  onCharacterCorrect?: (characterCount: number) => void
  onLeaderboardStart?: (promptId: string, wordId: string) => void
  onLeaderboardFinalize?: (
    promptId: string,
    attempts: Array<{ charIndex: number; submitted: string }>,
  ) => void
}

// ── Helpers ───────────────────────────────────

function isKatakanaPrompt(word: KotobaPrompt): boolean {
  return word.characters.length > 0 && isKatakanaChar(word.characters[0].kana)
}

// ── Main export ──────────────────────────────

export function KotobaGameWindow({
  mode,
  kotobaInput,
  jlptLevel,
  session: externalSession,
  cardClassName,
  children,
  onCharacterCorrect,
  onLeaderboardStart,
  onLeaderboardFinalize,
}: Props): ReactNode {
  const childArray = Array.isArray(children) ? children : children ? [children] : []
  const topLeft = childArray[0] ?? null
  const topRight = childArray[1] ?? null
  const { playSound } = useKeySound()
  const { playWordAudio, playKanaAudio } = useWordAudio()
  const hintsEnabled = useSettingsStore((s) => s.hints)

  const isKanjiMode = kotobaInput === 'kanji'

  // ── Practice session ──────────────────────

  const internalSession = useKotobaPracticeSession(jlptLevel)
  const {
    prompt: currentWord,
    isLoading,
    isEmpty,
    kanjiDistractors,
    recordWordComplete,
    advanceToNext,
  } = externalSession ?? internalSession

  // ── State ─────────────────────────────────

  const [inputValue, setInputValue] = useState('')
  const [completedCount, setCompletedCount] = useState(0)
  const [feedbackState, setFeedbackState] = useState<'idle' | 'correct' | 'wrong'>('idle')
  const [wrongAttemptsMap, setWrongAttemptsMap] = useState<number[]>([])
  const [wordDone, setWordDone] = useState(false)
  const [readingDone, setReadingDone] = useState(false)
  const [kanjiWrongCount, setKanjiWrongCount] = useState(0)

  // Tap feedback
  const [tapFeedbackId, setTapFeedbackId] = useState<string | null>(null)
  const [tapFeedbackState, setTapFeedbackState] = useState<'correct' | 'wrong' | null>(null)

  // Kanji selection
  const [selectedKanji, setSelectedKanji] = useState<string | null>(null)
  const [kanjiFeedback, setKanjiFeedback] = useState<'correct' | 'wrong' | null>(null)

  const generationRef = useRef(0)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const promptIdRef = useRef('')
  const firstAttemptsRef = useRef<string[]>([])
  const firstKanjiRef = useRef('')

  const startRef = useRef(onLeaderboardStart)
  startRef.current = onLeaderboardStart

  // ── Derived ───────────────────────────────

  const hasKanji = currentWord !== null && currentWord.kanji !== null

  const kanaBreakpoints = useMemo((): string[] => {
    if (!currentWord) return []
    const result: string[] = []
    let cumulative = ''
    for (const char of currentWord.characters) {
      cumulative += char.kana
      result.push(cumulative)
    }
    return result
  }, [currentWord])

  const fullKanaAnswer = kanaBreakpoints[kanaBreakpoints.length - 1] ?? ''
  const charCount = currentWord?.characters.length ?? 0
  const currentCharIndex = Math.min(completedCount, Math.max(charCount - 1, 0))
  const currentChar = currentWord?.characters[currentCharIndex] ?? null

  const TAP_GRID_SIZE = 10
  const tapGrid = useMemo(() => {
    if (!currentWord) return []
    const pool = isKatakanaPrompt(currentWord) ? KOTOBA_KATAKANA_TAP : KOTOBA_HIRAGANA_TAP
    const needed = currentWord.characters.map((c) => c.kana)
    const uniqueNeeded = [...new Set(needed)]

    const requiredChars = uniqueNeeded.map((kana) => {
      const existing = pool.find((p) => p.kana === kana)
      if (existing) return { ...existing }
      const romaji = currentWord.characters.find((c) => c.kana === kana)?.romaji ?? ''
      return { id: `dyn-${kana}`, kana, romaji }
    })

    const fillerPool = pool.filter((p) => !uniqueNeeded.includes(p.kana))
    const shuffled = [...fillerPool].sort(() => Math.random() - 0.5)
    const fillers = shuffled.slice(0, TAP_GRID_SIZE - requiredChars.length)

    return [...requiredChars, ...fillers].sort(() => Math.random() - 0.5)
  }, [currentWord])

  const kanjiOptions = useMemo((): string[] => {
    if (!isKanjiMode || !hasKanji || !currentWord?.kanji) return []
    const all = [currentWord.kanji, ...kanjiDistractors]
    return all.sort(() => Math.random() - 0.5)
  }, [currentWord, isKanjiMode, hasKanji, kanjiDistractors])

  // ── Helpers ───────────────────────────────

  function getWrongAttempts(idx: number): number {
    return wrongAttemptsMap[idx] ?? 0
  }

  const clearTimers = useCallback((): void => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
  }, [])

  const schedule = useCallback((fn: () => void, ms: number): void => {
    const gen = generationRef.current
    const id = setTimeout((): void => {
      if (gen === generationRef.current) fn()
    }, ms)
    timersRef.current.push(id)
  }, [])

  const resetAll = useCallback((): void => {
    generationRef.current++
    clearTimers()
    setInputValue('')
    setCompletedCount(0)
    setWrongAttemptsMap([])
    setWordDone(false)
    setFeedbackState('idle')
    setReadingDone(false)
    setTapFeedbackId(null)
    setTapFeedbackState(null)
    setSelectedKanji(null)
    setKanjiFeedback(null)
    setKanjiWrongCount(0)
  }, [clearTimers])

  const advanceWord = useCallback((): void => {
    resetAll()
    advanceToNext()
  }, [resetAll, advanceToNext])

  useEffect((): void => {
    resetAll()
  }, [mode, kotobaInput, resetAll])

  useEffect((): void => {
    if (currentWord?.id) {
      const id = crypto.randomUUID()
      promptIdRef.current = id
      firstAttemptsRef.current = new Array(currentWord.characters.length).fill('')
      firstKanjiRef.current = ''
      startRef.current?.(id, currentWord.id)
    }
  }, [currentWord, mode, kotobaInput])

  useEffect((): (() => void) => clearTimers, [clearTimers])

  // ── Complete handlers ─────────────────────

  const handleWordComplete = useCallback((): void => {
    clearTimers()
    generationRef.current++
    const wasClean = wrongAttemptsMap.every((c) => c === 0) && kanjiWrongCount === 0
    const multiplier = isKanjiMode ? KANJI_INPUT_MULTIPLIER : 1
    recordWordComplete(wasClean, multiplier)

    if (onLeaderboardFinalize && currentWord?.id) {
      const charAttempts = firstAttemptsRef.current
        .map((submitted, i) => ({ charIndex: i, submitted }))
        .filter((a) => a.submitted !== '')
      const attempts = [...charAttempts]
      if (isKanjiMode) {
        attempts.push({ charIndex: -1, submitted: firstKanjiRef.current })
      }
      onLeaderboardFinalize(promptIdRef.current, attempts)
    }

    setWordDone(true)
    setFeedbackState('correct')
    const wordId = currentWord?.id
    if (wordId && getWordAudioPath(wordId)) {
      playWordAudio(wordId)
    } else {
      const kana = currentWord?.characters[0]?.kana
      if (kana) playKanaAudio(kana)
    }
    schedule(advanceWord, KOTOBA_DISPLAY_MS)
  }, [
    clearTimers,
    schedule,
    advanceWord,
    wrongAttemptsMap,
    kanjiWrongCount,
    recordWordComplete,
    isKanjiMode,
    onLeaderboardFinalize,
    playWordAudio,
    playKanaAudio,
    currentWord,
  ])

  const handleReadingDone = useCallback((): void => {
    setReadingDone(true)
    setCompletedCount(charCount)
    if (!isKanjiMode || !hasKanji) {
      handleWordComplete()
    }
  }, [charCount, isKanjiMode, hasKanji, handleWordComplete])

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
    schedule((): void => {
      setFeedbackState('idle')
      setTapFeedbackId(null)
      setTapFeedbackState(null)
    }, FEEDBACK_FLASH_MS)
  }, [clearTimers, schedule, currentCharIndex])

  // ── Tap handler (kana buttons) ────────────

  const handleTap = useCallback(
    (id: string, value: string): void => {
      if (wordDone || readingDone || !currentChar) return
      setTapFeedbackId(id)

      if (firstAttemptsRef.current[completedCount] === '') {
        firstAttemptsRef.current[completedCount] = value
      }
      if (value === currentChar.kana) {
        setTapFeedbackState('correct')
        const newCompleted = completedCount + 1
        setCompletedCount(newCompleted)
        if ((wrongAttemptsMap[currentCharIndex] ?? 0) === 0) {
          onCharacterCorrect?.(1)
        }
        if (newCompleted === charCount) {
          handleReadingDone()
        } else {
          clearTimers()
          generationRef.current++
          setFeedbackState('correct')
          schedule((): void => {
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
      currentCharIndex,
      completedCount,
      charCount,
      wordDone,
      readingDone,
      wrongAttemptsMap,
      onCharacterCorrect,
      handleReadingDone,
      handleWrong,
      clearTimers,
      schedule,
    ],
  )

  // ── Type/Swipe handler ────────────────────

  const handleInputChange = useCallback(
    (value: string): void => {
      if (wordDone) return
      setInputValue(value)

      if (isKanjiMode && hasKanji) {
        // Kanji Type/Swipe: user types and selects kanji from IME
        const cleaned = value.replace(/\u200B/g, '').trim()
        if (cleaned.length === 0) return

        // Ignore kana-only input (IME composition in progress)
        const hasKanjiChar = /[一-鿿㐀-䶿]/.test(cleaned)
        if (!hasKanjiChar) return

        if (firstKanjiRef.current === '') firstKanjiRef.current = cleaned
        if (cleaned === currentWord?.kanji) {
          handleWordComplete()
        } else {
          setKanjiWrongCount((prev) => prev + 1)
          setFeedbackState('wrong')
          schedule((): void => setFeedbackState('idle'), FEEDBACK_FLASH_MS)
        }
        return
      }

      // Readings mode: user types kana directly, compared against kana breakpoints
      const cleaned = value.replace(/\u200B/g, '')
      const compare = cleaned

      if (compare.length === 0) return

      if (!fullKanaAnswer.startsWith(compare)) {
        if (firstAttemptsRef.current[completedCount] === '') {
          const prevBp = completedCount > 0 ? kanaBreakpoints[completedCount - 1] : ''
          firstAttemptsRef.current[completedCount] = compare.substring(prevBp.length)
        }
        handleWrong()
        return
      }
      if (feedbackState === 'wrong') setFeedbackState('idle')

      let newCompleted = 0
      for (const bp of kanaBreakpoints) {
        if (compare.length >= bp.length && compare.substring(0, bp.length) === bp) {
          newCompleted++
        }
      }
      if (newCompleted > completedCount) {
        for (let idx = completedCount; idx < newCompleted; idx++) {
          if (firstAttemptsRef.current[idx] === '') {
            const prevBp = idx > 0 ? kanaBreakpoints[idx - 1] : ''
            const nextBp = kanaBreakpoints[idx]
            firstAttemptsRef.current[idx] = compare.substring(prevBp.length, nextBp.length)
          }
          if ((wrongAttemptsMap[idx] ?? 0) === 0) onCharacterCorrect?.(1)
        }
      }
      setCompletedCount(newCompleted)
      if (compare === fullKanaAnswer) handleReadingDone()
    },
    [
      fullKanaAnswer,
      kanaBreakpoints,
      feedbackState,
      wordDone,
      currentWord,
      completedCount,
      wrongAttemptsMap,
      onCharacterCorrect,
      handleWrong,
      handleWordComplete,
      handleReadingDone,
      isKanjiMode,
      hasKanji,
      schedule,
    ],
  )

  // ── Kanji option tap ──────────────────────

  const handleKanjiTap = useCallback(
    (kanji: string): void => {
      if (!readingDone || wordDone || !currentWord?.kanji) return
      setSelectedKanji(kanji)
      if (firstKanjiRef.current === '') firstKanjiRef.current = kanji
      playSound(kanji === currentWord.kanji ? 'e' : 'o')

      if (kanji === currentWord.kanji) {
        setKanjiFeedback('correct')
        onCharacterCorrect?.(1)
        schedule(handleWordComplete, FEEDBACK_FLASH_MS)
      } else {
        setKanjiWrongCount((prev) => prev + 1)
        setKanjiFeedback('wrong')
        schedule((): void => {
          setSelectedKanji(null)
          setKanjiFeedback(null)
        }, FEEDBACK_FLASH_MS)
      }
    },
    [
      readingDone,
      wordDone,
      currentWord?.kanji,
      onCharacterCorrect,
      handleWordComplete,
      schedule,
      playSound,
    ],
  )

  // ── Furigana colour ───────────────────────

  function furiganaColour(index: number): string {
    if (wordDone) return 'text-feedback-correct'
    if (index < completedCount) return 'text-feedback-correct'
    if (hintsEnabled && getWrongAttempts(index) >= MAX_WRONG_ATTEMPTS) return 'text-feedback-wrong'
    return 'text-transparent'
  }

  // ── Kanji option style ────────────────────

  function kanjiOptionClass(kanji: string): string {
    if (wordDone && kanji === currentWord?.kanji)
      return 'bg-feedback-correct shadow-[0_3px_0_0_#2e9a73]'
    if (selectedKanji === kanji && kanjiFeedback === 'correct')
      return 'bg-sky-400 shadow-[0_3px_0_0_var(--color-sky-600)]'
    if (selectedKanji === kanji && kanjiFeedback === 'wrong')
      return 'bg-feedback-wrong shadow-[0_3px_0_0_#c47a3a]'
    if (readingDone) return 'bg-sky-100 shadow-[0_3px_0_0_var(--color-sky-300)]'
    return 'bg-warm-100 shadow-[0_2px_0_0_var(--color-warm-200)] opacity-50'
  }

  // ── Render ────────────────────────────────

  if (isLoading) {
    return (
      <div
        className={`${cardClassName ?? 'bg-[#faf5e4] shadow-[0_6px_0_0_#d4c9b0]'} rounded-2xl w-full max-w-md mx-auto p-6 md:p-8`}
      >
        <p className="text-warm-400 text-center" role="status" aria-label="Loading Kotoba practice">
          Loading...
        </p>
      </div>
    )
  }

  if (isEmpty || !currentWord) {
    return (
      <div
        className={`${cardClassName ?? 'bg-[#faf5e4] shadow-[0_6px_0_0_#d4c9b0]'} rounded-2xl w-full max-w-md mx-auto p-6 md:p-8`}
      >
        <p className="text-warm-400 text-center" role="status" aria-label="No words available">
          No words unlocked yet. Practice more kana to unlock Kotoba.
        </p>
      </div>
    )
  }

  return (
    <div
      className={`${cardClassName ?? 'bg-[#faf5e4] shadow-[0_6px_0_0_#d4c9b0]'} rounded-2xl w-full max-w-md mx-auto p-6 md:p-8`}
    >
      {/* Header row */}
      {(topLeft || topRight) && (
        <div className="flex items-center justify-between mb-3 -mt-2">
          {topLeft}
          {topRight}
        </div>
      )}

      {/* ─── READINGS MODE ─── */}
      {!isKanjiMode && (
        <>
          {/* English word */}
          <p className="text-xl md:text-2xl font-bold text-warm-800 text-center mb-3 capitalize">
            {currentWord.english}
          </p>

          {/* Kanji words: kanji prompt with furigana above */}
          {hasKanji && (
            <div className="text-center mb-4">
              <ruby
                className={`text-3xl md:text-4xl font-bold transition-colors duration-150 ${wordDone ? 'text-feedback-correct' : 'text-warm-800'}`}
              >
                {currentWord.kanji}
                <rp>(</rp>
                <rt className="text-base font-medium tracking-wider">
                  {currentWord.characters.map((char, i) => (
                    <span key={i} className={`transition-colors duration-150 ${furiganaColour(i)}`}>
                      {char.kana}
                    </span>
                  ))}
                </rt>
                <rp>)</rp>
              </ruby>
            </div>
          )}

          {/* Kana-only words: hidden until correct/hinted */}
          {!hasKanji && (
            <div className="text-center mb-4">
              <div className="text-3xl md:text-4xl font-bold min-h-[2.5rem] flex items-end justify-center gap-0.5">
                {currentWord.characters.map((char, i) => (
                  <span key={i} className={`transition-colors duration-150 ${furiganaColour(i)}`}>
                    {char.kana}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ─── KANJI MODE ─── */}
      {isKanjiMode && (
        <>
          {/* English prompt */}
          <p className="text-xl md:text-2xl font-bold text-warm-800 text-center mb-3 capitalize">
            {currentWord.english}
          </p>

          {/* Tap mode: furigana + kanji options */}
          {hasKanji && !wordDone && mode === 'tap' && (
            <div className="text-center mb-3">
              <div className="text-base font-medium min-h-[1.5rem] flex items-end justify-center gap-0.5 mb-1">
                {currentWord.characters.map((char, i) => (
                  <span key={i} className={`transition-colors duration-150 ${furiganaColour(i)}`}>
                    {char.kana}
                  </span>
                ))}
              </div>
              <div className="flex items-center justify-center gap-3">
                {kanjiOptions.map((kanji) => (
                  <button
                    key={kanji}
                    type="button"
                    disabled={!readingDone || wordDone}
                    onClick={(): void => handleKanjiTap(kanji)}
                    className={`${kanjiOptionClass(kanji)} rounded-xl px-4 py-3 min-h-[56px] flex items-center justify-center transition-all duration-75 active:translate-y-[2px] active:shadow-none`}
                    aria-label={`Select ${kanji}`}
                  >
                    <span className="text-2xl font-bold text-warm-800">{kanji}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Type/Swipe: persistent kanji area (empty, hint, or correct) */}
          {hasKanji && (mode === 'type' || mode === 'swipe') && (
            <div className="text-center mb-4 min-h-[3.5rem] flex items-center justify-center">
              {wordDone ? (
                <ruby className="text-3xl md:text-4xl font-bold text-feedback-correct">
                  {currentWord.kanji}
                  <rp>(</rp>
                  <rt className="text-base font-medium tracking-wider text-feedback-correct">
                    {currentWord.kana}
                  </rt>
                  <rp>)</rp>
                </ruby>
              ) : kanjiWrongCount >= MAX_WRONG_ATTEMPTS && hintsEnabled ? (
                <ruby className="text-3xl md:text-4xl font-bold text-feedback-wrong">
                  {currentWord.kanji}
                  <rp>(</rp>
                  <rt className="text-base font-medium tracking-wider text-feedback-wrong">
                    {currentWord.kana}
                  </rt>
                  <rp>)</rp>
                </ruby>
              ) : null}
            </div>
          )}

          {/* Tap: complete state */}
          {hasKanji && wordDone && mode === 'tap' && (
            <div className="text-center mb-4">
              <ruby className="text-3xl md:text-4xl font-bold text-feedback-correct">
                {currentWord.kanji}
                <rp>(</rp>
                <rt className="text-base font-medium tracking-wider text-feedback-correct">
                  {currentWord.kana}
                </rt>
                <rp>)</rp>
              </ruby>
            </div>
          )}

          {/* Kana-only fallback */}
          {!hasKanji && (
            <div className="text-center mb-3">
              <div className="text-3xl md:text-4xl font-bold min-h-[2.5rem] flex items-end justify-center gap-0.5">
                {currentWord.characters.map((char, i) => (
                  <span key={i} className={`transition-colors duration-150 ${furiganaColour(i)}`}>
                    {char.kana}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ─── INPUT AREA ─── */}

      {mode === 'tap' && (
        <TapInput
          characters={[...tapGrid]}
          displayField="kana"
          onTap={handleTap}
          feedbackId={tapFeedbackId}
          feedbackState={tapFeedbackState}
          variant="sage"
        />
      )}

      {mode === 'type' && (
        <div className="pt-2">
          <TypeInput
            value={inputValue}
            onChange={handleInputChange}
            feedbackState={feedbackState}
            disabled={wordDone}
            showKatakana={false}
            preventKanjiSuggestions={!isKanjiMode}
            keepKeyboardOpen
          />
          <p className="text-xs text-warm-400 text-center mt-1.5">
            {isKanjiMode && hasKanji
              ? 'Type and select kanji from suggestions'
              : 'Type the kana reading'}
          </p>
        </div>
      )}

      {mode === 'swipe' && (
        <div className="pt-2">
          <SwipeInput
            value={inputValue}
            onChange={handleInputChange}
            feedbackState={feedbackState}
            disabled={wordDone}
            showKatakana={false}
            keepKeyboardOpen
          />
          <p className="text-xs text-warm-400 text-center mt-1.5">
            {isKanjiMode && hasKanji
              ? 'Swipe and select kanji from suggestions'
              : 'Swipe the kana reading'}
          </p>
        </div>
      )}
    </div>
  )
}
