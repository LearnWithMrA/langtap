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
import { HIRAGANA_TAP, KATAKANA_TAP, toKatakana } from '@/components/game/kana-practice-data'
import type { UsePracticeSessionReturn, CharacterResult } from '@/hooks/usePracticeSession'

const MAX_WRONG_ATTEMPTS = 3

// ── Types ─────────────────────────────────────

type InputMode = 'type' | 'tap' | 'swipe'

type GameWindowProps = {
  mode: InputMode
  session: UsePracticeSessionReturn
  children?: ReactNode
}

// ── Helpers ───────────────────────────────────

function isKatakanaChar(kana: string): boolean {
  const code = kana.charCodeAt(0)
  return code >= 0x30a0 && code <= 0x30ff
}

// ── Component ─────────────────────────────────

export function GameWindow({ mode, session, children }: GameWindowProps): ReactNode {
  const childArray = Array.isArray(children) ? children : children ? [children] : []
  const topLeft = childArray[0] ?? null
  const topRight = childArray[1] ?? null

  const { prompt, isLoading, isEmpty, handleWordComplete, advanceToNext } = session

  type Direction = 'kana-to-romaji' | 'romaji-to-kana'
  const [direction, setDirection] = useState<Direction>('kana-to-romaji')
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

  const characters = prompt?.characters ?? []
  const isKatakana = characters.length > 0 && isKatakanaChar(characters[0].kana)
  const isKanaToRomaji = direction === 'kana-to-romaji'
  const currentCharIndex = Math.min(completedCount, characters.length - 1)
  const currentChar = characters[currentCharIndex]

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

    scheduleTimeout((): void => setShowMeaning(true), MEANING_FADE_MS)
    scheduleTimeout((): void => {
      setDirection((prev) => (prev === 'kana-to-romaji' ? 'romaji-to-kana' : 'kana-to-romaji'))
      advanceToNext()
    }, MEANING_DISPLAY_MS)
  }, [clearTimers, scheduleTimeout, characters.length, buildResults, handleWordComplete, advanceToNext])

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

      const cleaned = value.replace(/​/g, '')
      let compare = isKanaToRomaji ? cleaned.toLowerCase() : cleaned
      if (!isKanaToRomaji && isKatakana) {
        compare = toKatakana(compare)
      }

      setInputValue(value)

      const match = evaluateInput(compare, fullAnswer)

      if (match === 'no_match') {
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

      // Record start time for newly reached characters
      if (newCompleted > completedCount) {
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
    ],
  )

  // Tap: character-by-character
  const handleTap = useCallback(
    (id: string, value: string): void => {
      if (wordDone || !currentChar) return
      setTapFeedbackId(id)
      const expected = isKanaToRomaji ? currentChar.romaji : currentChar.kana
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

  if (isLoading) {
    return (
      <div className="bg-[#faf5e4] rounded-2xl shadow-[0_6px_0_0_#d4c9b0] w-full max-w-md mx-auto p-6 md:p-8">
        <p className="text-center text-warm-400 py-8">Loading...</p>
      </div>
    )
  }

  if (isEmpty || !prompt) {
    return (
      <div className="bg-[#faf5e4] rounded-2xl shadow-[0_6px_0_0_#d4c9b0] w-full max-w-md mx-auto p-6 md:p-8">
        <p className="text-center text-warm-600 py-8 font-medium">
          Unlock characters in the Dojo to start practising
        </p>
      </div>
    )
  }

  // ── Render ────────────────────────────────────

  return (
    <div className="bg-[#faf5e4] rounded-2xl shadow-[0_6px_0_0_#d4c9b0] w-full max-w-md mx-auto p-6 md:p-8">
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

      <MeaningReveal meaning={prompt.word.meaning} visible={showMeaning} />

      {mode === 'type' && (
        <div className="pt-3">
          <TypeInput
            value={inputValue}
            onChange={handleInputChange}
            feedbackState={feedbackState}
            disabled={wordDone}
            showKatakana={!isKanaToRomaji && isKatakana}
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
          />
          <p className="text-sm text-warm-400 text-center mt-2">
            This mode is for the mobile keyboard
          </p>
        </div>
      )}

      {mode === 'tap' && (
        <TapInput
          characters={isKatakana ? KATAKANA_TAP : HIRAGANA_TAP}
          displayField={isKanaToRomaji ? 'romaji' : 'kana'}
          onTap={handleTap}
          feedbackId={tapFeedbackId}
          feedbackState={tapFeedbackState}
        />
      )}
    </div>
  )
}
