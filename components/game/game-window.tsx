// ------------------------------------------------------------
// File: components/game/game-window.tsx
// Purpose: Floating game card containing the word prompt,
//          input area (varies by mode), and feedback elements.
//          The full word is shown with characters dimming as the
//          user types through them. All characters flash green on
//          word completion. Mock game loop with generation-guarded
//          timers. Replaced by the real engine in Sprint 4-5.
// Depends on: engine/constants.ts,
//             components/game/input-field.tsx,
//             components/game/tap-grid.tsx,
//             components/game/feedback-overlay.tsx,
//             components/game/meaning-reveal.tsx
// ------------------------------------------------------------

'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import type { ReactNode } from 'react'
import { InputField } from '@/components/game/input-field'
import { TapGrid } from '@/components/game/tap-grid'
import { FeedbackOverlay } from '@/components/game/feedback-overlay'
import { MeaningReveal } from '@/components/game/meaning-reveal'
import {
  FEEDBACK_FLASH_MS,
  WRONG_ANSWER_DELAY_MS,
  MEANING_DISPLAY_MS,
  MEANING_FADE_MS,
} from '@/engine/constants'

const MAX_WRONG_ATTEMPTS = 3

// -- Types --------------------------------------------------

type InputMode = 'type' | 'tap' | 'swipe'

type GameWindowProps = {
  mode: InputMode
  children?: ReactNode
}

type MockCharacter = {
  kana: string
  romaji: string
}

type MockWord = {
  word: string
  meaning: string
  characters: MockCharacter[]
}

// -- Mock data (replaced by real engine in Sprint 4-5) ------

const MOCK_WORDS: MockWord[] = [
  {
    word: 'あおい',
    meaning: 'blue',
    characters: [
      { kana: 'あ', romaji: 'a' },
      { kana: 'お', romaji: 'o' },
      { kana: 'い', romaji: 'i' },
    ],
  },
  {
    word: 'いぬ',
    meaning: 'dog',
    characters: [
      { kana: 'い', romaji: 'i' },
      { kana: 'ぬ', romaji: 'nu' },
    ],
  },
  {
    word: 'うみ',
    meaning: 'sea',
    characters: [
      { kana: 'う', romaji: 'u' },
      { kana: 'み', romaji: 'mi' },
    ],
  },
  {
    word: 'えき',
    meaning: 'station',
    characters: [
      { kana: 'え', romaji: 'e' },
      { kana: 'き', romaji: 'ki' },
    ],
  },
  {
    word: 'おんな',
    meaning: 'woman',
    characters: [
      { kana: 'お', romaji: 'o' },
      { kana: 'ん', romaji: 'n' },
      { kana: 'な', romaji: 'na' },
    ],
  },
]

const MOCK_TAP_CHARACTERS = [
  { id: 'h-a', kana: 'あ', romaji: 'a' },
  { id: 'h-i', kana: 'い', romaji: 'i' },
  { id: 'h-u', kana: 'う', romaji: 'u' },
  { id: 'h-e', kana: 'え', romaji: 'e' },
  { id: 'h-o', kana: 'お', romaji: 'o' },
  { id: 'h-ki', kana: 'き', romaji: 'ki' },
  { id: 'h-nu', kana: 'ぬ', romaji: 'nu' },
  { id: 'h-mi', kana: 'み', romaji: 'mi' },
  { id: 'h-n', kana: 'ん', romaji: 'n' },
  { id: 'h-na', kana: 'な', romaji: 'na' },
]

// -- Component ----------------------------------------------

export function GameWindow({ mode, children }: GameWindowProps): ReactNode {
  const childArray = Array.isArray(children) ? children : children ? [children] : []
  const topLeft = childArray[0] ?? null
  const topRight = childArray[1] ?? null

  const [wordIndex, setWordIndex] = useState(0)
  const [inputValue, setInputValue] = useState('')
  const [completedCount, setCompletedCount] = useState(0)
  const [feedbackState, setFeedbackState] = useState<'idle' | 'correct' | 'wrong'>('idle')
  const [wrongAttempts, setWrongAttempts] = useState(0)
  const [showRomajiHint, setShowRomajiHint] = useState(false)
  const [showMeaning, setShowMeaning] = useState(false)
  const [tapFeedbackId, setTapFeedbackId] = useState<string | null>(null)
  const [tapFeedbackState, setTapFeedbackState] = useState<'correct' | 'wrong' | null>(null)

  const generationRef = useRef(0)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const currentWord = MOCK_WORDS[wordIndex]

  // Cumulative romaji breakpoints: ['a', 'ao', 'aoi'] for あおい
  const breakpoints = useMemo((): string[] => {
    const result: string[] = []
    let cumulative = ''
    for (const char of currentWord.characters) {
      cumulative += char.romaji
      result.push(cumulative)
    }
    return result
  }, [currentWord])

  const fullRomaji = breakpoints[breakpoints.length - 1]
  const currentCharIndex = Math.min(completedCount, currentWord.characters.length - 1)
  const currentChar = currentWord.characters[currentCharIndex]

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

  const resetAll = useCallback((): void => {
    generationRef.current++
    clearTimers()
    setInputValue('')
    setCompletedCount(0)
    setWrongAttempts(0)
    setFeedbackState('idle')
    setShowRomajiHint(false)
    setShowMeaning(false)
    setTapFeedbackId(null)
    setTapFeedbackState(null)
  }, [clearTimers])

  const advanceWord = useCallback((): void => {
    resetAll()
    setWordIndex((prev) => (prev + 1) % MOCK_WORDS.length)
  }, [resetAll])

  // Reset on mode change
  useEffect((): void => {
    resetAll()
    setWordIndex(0)
  }, [mode, resetAll])

  useEffect((): (() => void) => {
    return clearTimers
  }, [clearTimers])

  // Word complete: flash green, show meaning, advance
  const handleWordComplete = useCallback((): void => {
    clearTimers()
    generationRef.current++
    setCompletedCount(currentWord.characters.length)
    setFeedbackState('correct')
    setShowRomajiHint(false)
    scheduleTimeout((): void => setShowMeaning(true), MEANING_FADE_MS)
    scheduleTimeout(advanceWord, MEANING_DISPLAY_MS)
  }, [clearTimers, scheduleTimeout, advanceWord, currentWord.characters.length])

  // Wrong answer: progressive orange, auto-reveal on third attempt
  const handleWrong = useCallback((): void => {
    clearTimers()
    generationRef.current++
    const newAttempts = wrongAttempts + 1
    setWrongAttempts(newAttempts)
    setFeedbackState('wrong')

    if (newAttempts >= MAX_WRONG_ATTEMPTS) {
      // Third strike: show the answer, keep orange until typed correctly
      setShowRomajiHint(true)
      scheduleTimeout((): void => {
        setFeedbackState('idle')
        const lastGood = completedCount > 0 ? breakpoints[completedCount - 1] : ''
        setInputValue(lastGood)
        setTapFeedbackId(null)
        setTapFeedbackState(null)
      }, FEEDBACK_FLASH_MS)
    } else {
      scheduleTimeout((): void => {
        setFeedbackState('idle')
        const lastGood = completedCount > 0 ? breakpoints[completedCount - 1] : ''
        setInputValue(lastGood)
        setTapFeedbackId(null)
        setTapFeedbackState(null)
      }, FEEDBACK_FLASH_MS)
    }
  }, [clearTimers, scheduleTimeout, completedCount, breakpoints, wrongAttempts])

  // Type/Swipe: cumulative input evaluation
  const handleInputChange = useCallback((value: string): void => {
    const lower = value.toLowerCase()

    // Check if input is a valid prefix of the full romaji
    if (!fullRomaji.startsWith(lower)) {
      setInputValue(value)
      handleWrong()
      return
    }

    setInputValue(value)
    setShowRomajiHint(false)
    setFeedbackState('idle')

    // Update completed count based on breakpoints passed
    let newCompleted = 0
    for (const bp of breakpoints) {
      if (lower.length >= bp.length && lower.substring(0, bp.length) === bp) {
        newCompleted++
      }
    }
    if (newCompleted > completedCount) {
      setWrongAttempts(0)
      setShowRomajiHint(false)
    }
    setCompletedCount(newCompleted)

    // Check if word is fully typed
    if (lower === fullRomaji) {
      handleWordComplete()
    }
  }, [fullRomaji, breakpoints, completedCount, handleWrong, handleWordComplete])

  // Tap: character-by-character, matching romaji
  const handleTap = useCallback((id: string, romaji: string): void => {
    setTapFeedbackId(id)
    if (romaji === currentChar.romaji) {
      setTapFeedbackState('correct')
      setShowRomajiHint(false)
      setWrongAttempts(0)
      const newCompleted = completedCount + 1
      setCompletedCount(newCompleted)

      if (newCompleted === currentWord.characters.length) {
        handleWordComplete()
      } else {
        // Brief flash then reset tap feedback
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
  }, [currentChar.romaji, completedCount, currentWord.characters.length, handleWordComplete, handleWrong, clearTimers, scheduleTimeout])

  // Character colour: green when complete, dimmed when passed, dark when current/upcoming
  // Progressive orange: light on first wrong, medium on second, full on third
  const WRONG_COLOURS = ['text-[#f5c490]', 'text-[#f5ac6a]', 'text-feedback-wrong']

  function charColour(index: number): string {
    if (showMeaning || feedbackState === 'correct' && completedCount === currentWord.characters.length) {
      return 'text-feedback-correct'
    }
    if (index === currentCharIndex && wrongAttempts > 0) {
      return WRONG_COLOURS[Math.min(wrongAttempts - 1, WRONG_COLOURS.length - 1)]
    }
    if (index < completedCount) return 'text-feedback-correct'
    return 'text-warm-800'
  }

  return (
    <div className="bg-[#faf5e4] rounded-2xl shadow-[0_6px_0_0_#d4c9b0] w-full max-w-md mx-auto p-6 md:p-8">
      {(topLeft || topRight) && (
        <div className="flex items-center justify-between mb-2 -mt-2">
          {topLeft}
          {topRight}
        </div>
      )}

      {/* Word prompt: characters dim as completed, all green on finish */}
      {/* Romaji hint floats above the current character without affecting layout */}
      <div className="text-5xl md:text-6xl font-bold text-center py-1 select-none leading-tight">
        {currentWord.characters.map((char, i) => (
          <span key={i} className={['relative inline-block transition-colors duration-150', charColour(i)].join(' ')}>
            {showRomajiHint && i === currentCharIndex && (
              <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-lg font-medium text-warm-400 whitespace-nowrap">
                {char.romaji}
              </span>
            )}
            {char.kana}
          </span>
        ))}
      </div>

      <MeaningReveal meaning={currentWord.meaning} visible={showMeaning} />

      {(mode === 'type' || mode === 'swipe') && (
        <div className="pt-3">
          <InputField
            value={inputValue}
            onChange={handleInputChange}
            feedbackState={feedbackState}
            disabled={showMeaning}
          />
          {mode === 'swipe' && (
            <p className="text-sm text-warm-400 text-center mt-2">
              This mode is for the mobile swipe keyboard
            </p>
          )}
        </div>
      )}

      {mode === 'tap' && (
        <TapGrid
          characters={MOCK_TAP_CHARACTERS}
          onTap={handleTap}
          feedbackId={tapFeedbackId}
          feedbackState={tapFeedbackState}
        />
      )}
    </div>
  )
}
