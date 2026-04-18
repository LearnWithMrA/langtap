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
import { MeaningReveal } from '@/components/game/meaning-reveal'
import { FEEDBACK_FLASH_MS, MEANING_DISPLAY_MS, MEANING_FADE_MS } from '@/engine/constants'

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
    word: 'ネコ',
    meaning: 'cat',
    characters: [
      { kana: 'ネ', romaji: 'ne' },
      { kana: 'コ', romaji: 'ko' },
    ],
  },
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
  {
    word: 'パン',
    meaning: 'bread',
    characters: [
      { kana: 'パ', romaji: 'pa' },
      { kana: 'ン', romaji: 'n' },
    ],
  },
  {
    word: 'テレビ',
    meaning: 'television',
    characters: [
      { kana: 'テ', romaji: 'te' },
      { kana: 'レ', romaji: 're' },
      { kana: 'ビ', romaji: 'bi' },
    ],
  },
  {
    word: 'カメラ',
    meaning: 'camera',
    characters: [
      { kana: 'カ', romaji: 'ka' },
      { kana: 'メ', romaji: 'me' },
      { kana: 'ラ', romaji: 'ra' },
    ],
  },
]

const HIRAGANA_TAP = [
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

const KATAKANA_TAP = [
  { id: 'k-ne', kana: 'ネ', romaji: 'ne' },
  { id: 'k-ko', kana: 'コ', romaji: 'ko' },
  { id: 'k-pa', kana: 'パ', romaji: 'pa' },
  { id: 'k-n', kana: 'ン', romaji: 'n' },
  { id: 'k-te', kana: 'テ', romaji: 'te' },
  { id: 'k-re', kana: 'レ', romaji: 're' },
  { id: 'k-bi', kana: 'ビ', romaji: 'bi' },
  { id: 'k-ka', kana: 'カ', romaji: 'ka' },
  { id: 'k-me', kana: 'メ', romaji: 'me' },
  { id: 'k-ra', kana: 'ラ', romaji: 'ra' },
]

// Detect if a word uses katakana (check first character)
function isKatakanaWord(word: MockWord): boolean {
  const code = word.characters[0].kana.charCodeAt(0)
  return code >= 0x30a0 && code <= 0x30ff
}

// Convert hiragana to katakana (fixed Unicode offset of 0x60)
function toKatakana(str: string): string {
  return str.replace(/[\u3040-\u309F]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) + 0x60))
}

// -- Component ----------------------------------------------

export function GameWindow({ mode, children }: GameWindowProps): ReactNode {
  const childArray = Array.isArray(children) ? children : children ? [children] : []
  const topLeft = childArray[0] ?? null
  const topRight = childArray[1] ?? null

  // Direction alternates each word: kana prompt + romaji answer, then romaji prompt + kana answer
  type Direction = 'kana-to-romaji' | 'romaji-to-kana'
  const [direction, setDirection] = useState<Direction>('kana-to-romaji')
  const [wordIndex, setWordIndex] = useState(0)
  const [inputValue, setInputValue] = useState('')
  const [completedCount, setCompletedCount] = useState(0)
  const [feedbackState, setFeedbackState] = useState<'idle' | 'correct' | 'wrong'>('idle')
  const [wrongAttemptsMap, setWrongAttemptsMap] = useState<number[]>([])
  // Hint visibility is derived: show when current char has 3+ wrong attempts

  const [showMeaning, setShowMeaning] = useState(false)
  const [wordDone, setWordDone] = useState(false)
  const [tapFeedbackId, setTapFeedbackId] = useState<string | null>(null)
  const [tapFeedbackState, setTapFeedbackState] = useState<'correct' | 'wrong' | null>(null)

  const generationRef = useRef(0)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const currentWord = MOCK_WORDS[wordIndex]

  // Cumulative breakpoints for both directions
  const romajiBreakpoints = useMemo((): string[] => {
    const result: string[] = []
    let cumulative = ''
    for (const char of currentWord.characters) {
      cumulative += char.romaji
      result.push(cumulative)
    }
    return result
  }, [currentWord])

  const kanaBreakpoints = useMemo((): string[] => {
    const result: string[] = []
    let cumulative = ''
    for (const char of currentWord.characters) {
      cumulative += char.kana
      result.push(cumulative)
    }
    return result
  }, [currentWord])

  const isKanaToRomaji = direction === 'kana-to-romaji'
  const breakpoints = isKanaToRomaji ? romajiBreakpoints : kanaBreakpoints
  const fullAnswer = breakpoints[breakpoints.length - 1]
  const currentCharIndex = Math.min(completedCount, currentWord.characters.length - 1)
  const currentChar = currentWord.characters[currentCharIndex]

  // Per-character wrong attempts and derived hint visibility
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

  const resetAll = useCallback((): void => {
    generationRef.current++
    clearTimers()
    setInputValue('')
    setCompletedCount(0)
    setWrongAttemptsMap([])
    setWordDone(false)
    setFeedbackState('idle')
    setShowMeaning(false)
    setTapFeedbackId(null)
    setTapFeedbackState(null)
  }, [clearTimers])

  const advanceWord = useCallback((): void => {
    resetAll()
    setDirection((prev) => (prev === 'kana-to-romaji' ? 'romaji-to-kana' : 'kana-to-romaji'))
    setWordIndex((prev) => (prev + 1) % MOCK_WORDS.length)
  }, [resetAll])

  // Reset input on mode change but keep the current word
  useEffect((): void => {
    resetAll()
  }, [mode, resetAll])

  useEffect((): (() => void) => {
    return clearTimers
  }, [clearTimers])

  // Word complete: flash green, show meaning, advance
  const handleWordComplete = useCallback((): void => {
    clearTimers()
    generationRef.current++
    setWordDone(true)
    setCompletedCount(currentWord.characters.length)
    setFeedbackState('correct')
    scheduleTimeout((): void => setShowMeaning(true), MEANING_FADE_MS)
    scheduleTimeout(advanceWord, MEANING_DISPLAY_MS)
  }, [clearTimers, scheduleTimeout, advanceWord, currentWord.characters.length])

  // Wrong answer: increment per-character wrong count, progressive orange
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

    // No auto-clear: player backspaces to correct their own input
    scheduleTimeout((): void => {
      setFeedbackState('idle')
      setTapFeedbackId(null)
      setTapFeedbackState(null)
    }, FEEDBACK_FLASH_MS)
  }, [clearTimers, scheduleTimeout, currentCharIndex])

  // Type/Swipe: cumulative input evaluation
  const handleInputChange = useCallback(
    (value: string): void => {
      if (wordDone) return
      // For kana input, compare as-is. For romaji input, lowercase.
      // Strip zero-width spaces inserted by InputField for IME separation
      const cleaned = value.replace(/\u200B/g, '')
      // For romaji input: lowercase. For kana input on a katakana word: convert hiragana to katakana.
      let compare = isKanaToRomaji ? cleaned.toLowerCase() : cleaned
      if (!isKanaToRomaji && isKatakanaWord(currentWord)) {
        compare = toKatakana(compare)
      }

      setInputValue(value)

      // Check if input is a valid prefix of the expected answer
      if (!fullAnswer.startsWith(compare)) {
        handleWrong()
        return
      }

      // Valid prefix: clear wrong state if user backspaced to fix
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
      setCompletedCount(newCompleted)

      // Check if word is fully typed
      if (compare === fullAnswer) {
        handleWordComplete()
      }
    },
    [
      fullAnswer,
      breakpoints,
      feedbackState,
      wordDone,
      isKanaToRomaji,
      handleWrong,
      handleWordComplete,
    ],
  )

  // Tap: character-by-character, matching answer value
  const handleTap = useCallback(
    (id: string, value: string): void => {
      if (wordDone) return
      setTapFeedbackId(id)
      const expected = isKanaToRomaji ? currentChar.romaji : currentChar.kana
      if (value === expected) {
        setTapFeedbackState('correct')
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
    },
    [
      currentChar.romaji,
      currentChar.kana,
      isKanaToRomaji,
      completedCount,
      currentWord.characters.length,
      wordDone,
      handleWordComplete,
      handleWrong,
      clearTimers,
      scheduleTimeout,
    ],
  )

  // Character colour: green when complete, dimmed when passed, dark when current/upcoming
  // Progressive orange: light on first wrong, medium on second, full on third
  const WRONG_COLOURS = ['text-[#f5c490]', 'text-[#f5ac6a]', 'text-feedback-wrong']

  function charColour(index: number): string {
    if (
      showMeaning ||
      (feedbackState === 'correct' && completedCount === currentWord.characters.length)
    ) {
      return 'text-feedback-correct'
    }
    const charWrong = getWrongAttempts(index)
    if (index >= completedCount && charWrong > 0) {
      return WRONG_COLOURS[Math.min(charWrong - 1, WRONG_COLOURS.length - 1)]
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

      {/* Word prompt: shows kana or romaji depending on direction */}
      {/* Hint floats above the current character without affecting layout */}
      <div className="text-5xl md:text-6xl font-bold text-center py-1 select-none leading-tight">
        {currentWord.characters.map((char, i) => {
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

      <MeaningReveal meaning={currentWord.meaning} visible={showMeaning} />

      {(mode === 'type' || mode === 'swipe') && (
        <div className="pt-3">
          <InputField
            value={inputValue}
            onChange={handleInputChange}
            feedbackState={feedbackState}
            disabled={wordDone}
            showKatakana={!isKanaToRomaji && isKatakanaWord(currentWord)}
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
          characters={isKatakanaWord(currentWord) ? KATAKANA_TAP : HIRAGANA_TAP}
          displayField={isKanaToRomaji ? 'romaji' : 'kana'}
          onTap={handleTap}
          feedbackId={tapFeedbackId}
          feedbackState={tapFeedbackState}
        />
      )}
    </div>
  )
}
