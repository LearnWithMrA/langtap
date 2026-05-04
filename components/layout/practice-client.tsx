// ------------------------------------------------------------
// File: components/layout/practice-client.tsx
// Purpose: Client component composing the full practice screen.
//          Layers the parallax landscape, mascot, distance counter
//          with mode selector, game window, and audio player into
//          a full-viewport scene. Scene renders static until cyclist
//          frames load, then landscape and cyclist animate together.
//          Swipe mode uses a compact layout preset (hides mascot).
// Depends on: components/layout/landscape-background.tsx,
//             components/animation/cycling-character.tsx,
//             components/game/game-window.tsx,
//             components/game/distance-counter.tsx,
//             components/audio/audio-player.tsx
// ------------------------------------------------------------

'use client'

import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useSearchParams } from 'next/navigation'
import { useReducedMotion } from 'motion/react'
import { LandscapeBackground } from '@/components/layout/landscape-background'
import { CyclingCharacter } from '@/components/animation/cycling-character'
import { GameWindow } from '@/components/game/game-window'
import { KotobaGameWindow } from '@/components/game/kotoba-game-window'
import { DistanceCounter } from '@/components/game/distance-counter'
import { AudioPlayer } from '@/components/audio/audio-player'
import { DialogueOverlay } from '@/components/game/dialogue-overlay'
import { PracticeBanner } from '@/components/game/practice-banner'
import { useKeySound } from '@/hooks/useKeySound'
import { usePracticeCounters } from '@/hooks/usePracticeCounters'
import { usePracticeSession } from '@/hooks/usePracticeSession'
import { useTutorialTrial } from '@/hooks/useTutorialTrial'
import { useKotobaTrialSession } from '@/hooks/useKotobaTrialSession'
import { useDialogueSeen } from '@/hooks/useDialogueSeen'
import { useAuth } from '@/hooks/useAuth'
import { useSettingsStore } from '@/stores/settings.store'
import { useAuthModalStore } from '@/stores/auth-modal.store'
import { useGuestDistanceStore } from '@/stores/guest-distance.store'
import { DIALOGUE_SCRIPTS } from '@/data/tutorial/dialogue-scripts'
import { TRIAL_ALLOWED_IDS } from '@/data/tutorial/trial-prompts'
import { GUEST_TRIAL_DISTANCE_CAP } from '@/engine/constants'

const TRIAL_ALLOWED_SET = new Set(TRIAL_ALLOWED_IDS)
const KANA_TRIAL_CARD = 'bg-[#ddf0e8] shadow-[0_6px_0_0_#a0d0b8]'
const KOTOBA_TRIAL_CARD = 'bg-[#dce8f5] shadow-[0_6px_0_0_#a8bed8]'

// -- Types --------------------------------------------------

type InputMode = 'type' | 'tap' | 'swipe'
type GameType = 'kana' | 'kotoba'

const ALL_MODES: InputMode[] = ['tap', 'type', 'swipe']

const MODE_LABELS: Record<InputMode, string> = {
  type: 'Type',
  tap: 'Tap',
  swipe: 'Swipe',
}

// -- Mode dropdown ------------------------------------------

function ModeDropdown({
  mode,
  onModeChange,
  gameType,
}: {
  mode: InputMode
  onModeChange: (m: InputMode) => void
  gameType: GameType
}): ReactNode {
  const [isOpen, setIsOpen] = useState(false)
  const { playSound } = useKeySound()
  const label = gameType === 'kana' ? 'Kana' : 'Kotoba'

  return (
    <div className="relative">
      <button
        type="button"
        onClick={(): void => {
          playSound('ui-dropdown')
          setIsOpen(!isOpen)
        }}
        className="text-sm font-bold text-warm-800 hover:text-sage-400 transition-colors duration-150 cursor-pointer translate-y-0"
        aria-label={`Current mode: ${label} ${MODE_LABELS[mode]}. Click to change.`}
        aria-expanded={isOpen}
      >
        {label} {MODE_LABELS[mode]} ▾
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg py-1 min-w-[120px] z-50">
          {ALL_MODES.map((m) => (
            <button
              key={m}
              type="button"
              onClick={(): void => {
                playSound('ui-mode-switch')
                onModeChange(m)
                setIsOpen(false)
              }}
              className={[
                'w-full text-left px-3 py-1.5 text-sm transition-colors duration-150 cursor-pointer',
                m === mode
                  ? 'text-sage-500 font-bold'
                  : 'text-warm-800 hover:text-sage-400 hover:bg-sage-50',
              ].join(' ')}
            >
              {MODE_LABELS[m]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// -- Component ----------------------------------------------

export function PracticeClient(): ReactNode {
  const searchParams = useSearchParams()
  const gameType = (searchParams.get('mode') === 'kotoba' ? 'kotoba' : 'kana') as GameType
  const [mode, setMode] = useState<InputMode>('tap')
  const kotobaInput = useSettingsStore((s) => s.kotobaInput)
  const prefersReducedMotion = useReducedMotion()
  const { counters, incrementCorrect } = usePracticeCounters()
  const kanaSession = usePracticeSession('N5')
  const trialSession = useTutorialTrial()
  const kotobaTrialSession = useKotobaTrialSession()
  const { isGuest } = useAuth()
  const openSignUp = useAuthModalStore((s) => s.openSignUp)

  const sceneSpeed = prefersReducedMotion ? 'stopped' : 'idle'
  const animated = !prefersReducedMotion

  // ── Dialogue chain ──────────────────────────
  const { hasSeen: hasSeenKanaIntro, markSeen: markKanaIntroSeen } =
    useDialogueSeen('kana-first-play')
  const { hasSeen: hasSeenSettings, markSeen: markSettingsSeen } =
    useDialogueSeen('kana-post-trial')
  const kanaModeKey = `kana-mode-${mode}` as const
  const { hasSeen: hasSeenKanaMode, markSeen: markKanaModeSeen } = useDialogueSeen(kanaModeKey)
  const trialKey = `kana-trial-${mode}` as const
  const { hasSeen: hasSeenTrial, markSeen: markTrialSeen } = useDialogueSeen(trialKey)
  const { hasSeen: hasSeenTrialBanner, markSeen: markTrialBannerSeen } =
    useDialogueSeen('kana-trial-banner')
  const kotobaModeKey = `kotoba-first-${mode}` as const
  const { hasSeen: hasSeenKotobaMode, markSeen: markKotobaModeSeen } =
    useDialogueSeen(kotobaModeKey)
  const kotobaTrialKey = `kotoba-trial-${mode}` as const
  const { hasSeen: hasSeenKotobaTrial, markSeen: markKotobaTrialSeen } =
    useDialogueSeen(kotobaTrialKey)
  const { hasSeen: hasSeenKotobaBanner, markSeen: markKotobaBannerSeen } =
    useDialogueSeen('kotoba-intro-banner')

  const skipTrial = useCallback((): void => {
    markKanaModeSeen()
    markTrialSeen()
  }, [markKanaModeSeen, markTrialSeen])

  const skipKotobaTrial = useCallback((): void => {
    markKotobaModeSeen()
    markKotobaTrialSeen()
  }, [markKotobaModeSeen, markKotobaTrialSeen])

  const kanaDialogue =
    gameType === 'kana'
      ? !hasSeenKanaIntro
        ? {
            script: DIALOGUE_SCRIPTS['kana-first-play'],
            onDismiss: markKanaIntroSeen,
            theme: 'green' as const,
            onSkip: undefined as (() => void) | undefined,
            skipLabel: undefined as string | undefined,
          }
        : !hasSeenSettings
          ? {
              script: DIALOGUE_SCRIPTS['kana-post-trial'],
              onDismiss: markSettingsSeen,
              theme: 'green' as const,
              onSkip: undefined,
              skipLabel: undefined,
            }
          : !hasSeenKanaMode
            ? {
                script: DIALOGUE_SCRIPTS[kanaModeKey],
                onDismiss: markKanaModeSeen,
                theme: 'green' as const,
                onSkip: skipTrial,
                skipLabel: 'Skip trial',
              }
            : null
      : null

  const kotobaDialogue =
    gameType === 'kotoba' && !hasSeenKotobaMode
      ? {
          script: DIALOGUE_SCRIPTS[kotobaModeKey],
          onDismiss: markKotobaModeSeen,
          theme: 'blue' as const,
          onSkip: skipKotobaTrial,
          skipLabel: 'Skip trial',
        }
      : null

  const activeDialogue = kanaDialogue ?? kotobaDialogue

  // ── Trial round gate ────────────────────────
  const showKanaTrial = gameType === 'kana' && !activeDialogue && !hasSeenTrial
  const showKotobaTrial = gameType === 'kotoba' && !activeDialogue && !hasSeenKotobaTrial

  // ── Post-trial / post-kotoba banners ────────
  const showTrialBanner =
    gameType === 'kana' && hasSeenTrial && !hasSeenTrialBanner && !activeDialogue
  const showKotobaBanner =
    gameType === 'kotoba' && hasSeenKotobaTrial && !hasSeenKotobaBanner && !activeDialogue

  // ── Guest trial cap ─────────────────────────
  const guestDistances = useGuestDistanceStore((s) => s.distances)
  const addGuestDistance = useGuestDistanceStore((s) => s.addDistance)
  const totalGuestDistance = guestDistances.kana + guestDistances.kotoba
  const isOverCap = isGuest && totalGuestDistance >= GUEST_TRIAL_DISTANCE_CAP

  useEffect(() => {
    if (trialSession.isComplete && !hasSeenTrial) markTrialSeen()
  }, [trialSession.isComplete, hasSeenTrial, markTrialSeen])

  useEffect(() => {
    if (kotobaTrialSession.isComplete && !hasSeenKotobaTrial) markKotobaTrialSeen()
  }, [kotobaTrialSession.isComplete, hasSeenKotobaTrial, markKotobaTrialSeen])

  // ── Special character hints ──────────────────
  const { hasSeen: hasSeenHSokuon, markSeen: markHSokuonSeen } =
    useDialogueSeen('sokuon-hiragana-hint')
  const { hasSeen: hasSeenKSokuon, markSeen: markKSokuonSeen } =
    useDialogueSeen('sokuon-katakana-hint')
  const { hasSeen: hasSeenLongVowel, markSeen: markLongVowelSeen } =
    useDialogueSeen('longvowel-hint')

  const currentPromptCharIds = kanaSession.prompt?.characters.map((c) => c.id) ?? []
  const showHiraganaSokuonHint =
    !hasSeenHSokuon &&
    !activeDialogue &&
    !showKanaTrial &&
    gameType === 'kana' &&
    currentPromptCharIds.includes('h-sokuon')
  const showKatakanaSokuonHint =
    !hasSeenKSokuon &&
    !activeDialogue &&
    !showKanaTrial &&
    gameType === 'kana' &&
    !showHiraganaSokuonHint &&
    currentPromptCharIds.includes('k-sokuon')
  const showLongVowelHint =
    !hasSeenLongVowel &&
    !activeDialogue &&
    !showKanaTrial &&
    gameType === 'kana' &&
    !showHiraganaSokuonHint &&
    !showKatakanaSokuonHint &&
    currentPromptCharIds.includes('k-longvowel')

  const handleCharacterCorrect = useCallback((): void => {
    incrementCorrect(mode)
    if (isGuest) {
      addGuestDistance(gameType, 1)
    }
  }, [incrementCorrect, mode, isGuest, addGuestDistance, gameType])

  return (
    <div className="theme-day relative w-full h-svh overflow-hidden">
      {/* Parallax landscape */}
      <LandscapeBackground
        speed={sceneSpeed}
        staticHills={prefersReducedMotion ?? false}
        animated={animated}
      />

      <div
        className="absolute bottom-[calc(12svh-max(7.73vw,62.7px))] -left-[2%] md:left-[3%] z-[3]"
        aria-hidden="true"
      >
        <CyclingCharacter speed={sceneSpeed} />
      </div>

      {/* Audio player: bottom right */}
      <div className="absolute bottom-4 right-4 z-10">
        <AudioPlayer />
      </div>

      {/* Game window: centred, raised 40% */}
      <div className="absolute left-1/2 -translate-x-1/2 top-[34%] -translate-y-1/2 z-10 w-full max-w-lg px-4">
        {activeDialogue ? (
          <DialogueOverlay
            key={activeDialogue.script.messages[0]}
            messages={activeDialogue.script.messages}
            mascotPose={activeDialogue.script.mascotPose}
            theme={activeDialogue.theme}
            onDismiss={activeDialogue.onDismiss}
            onSkip={activeDialogue.onSkip}
            skipLabel={activeDialogue.skipLabel}
          />
        ) : showKanaTrial && !trialSession.isComplete ? (
          <GameWindow
            key={trialSession.prompt?.word.id ?? 'trial'}
            mode={mode}
            session={trialSession}
            allowedCharIds={TRIAL_ALLOWED_SET}
            cardClassName={KANA_TRIAL_CARD}
          >
            <ModeDropdown mode={mode} onModeChange={setMode} gameType="kana" />
            <span className="text-base font-bold text-[#3a6a50] tracking-wider">Trial</span>
          </GameWindow>
        ) : showKotobaTrial && !kotobaTrialSession.isComplete ? (
          <KotobaGameWindow
            key={kotobaTrialSession.prompt?.id ?? 'kotoba-trial'}
            mode={mode}
            kotobaInput={kotobaInput}
            session={kotobaTrialSession}
            cardClassName={KOTOBA_TRIAL_CARD}
          >
            <ModeDropdown mode={mode} onModeChange={setMode} gameType="kotoba" />
            <span className="text-base font-bold text-[#4a6a8a] tracking-wider">Trial</span>
          </KotobaGameWindow>
        ) : isOverCap ? (
          <div className="opacity-50 pointer-events-none">
            {gameType === 'kotoba' ? (
              <KotobaGameWindow mode={mode} kotobaInput={kotobaInput}>
                <ModeDropdown mode={mode} onModeChange={setMode} gameType={gameType} />
                <DistanceCounter value={counters[mode]} />
              </KotobaGameWindow>
            ) : (
              <GameWindow
                key={kanaSession.prompt?.word.id ?? 'kana'}
                mode={mode}
                session={kanaSession}
                allowedCharIds={kanaSession.practiceIds}
              >
                <ModeDropdown mode={mode} onModeChange={setMode} gameType="kana" />
                <DistanceCounter value={counters[mode]} />
              </GameWindow>
            )}
          </div>
        ) : gameType === 'kotoba' ? (
          <>
            {showKotobaBanner && (
              <PracticeBanner variant="kotoba" buttonLabel="Got it" onAction={markKotobaBannerSeen}>
                You've finished the trial. Let's practice for real. Don't forget to{' '}
                <button
                  type="button"
                  onClick={openSignUp}
                  className="text-sage-500 font-medium hover:underline"
                >
                  sign up
                </button>{' '}
                to save your progress. :)
              </PracticeBanner>
            )}
            <KotobaGameWindow
              mode={mode}
              kotobaInput={kotobaInput}
              onCharacterCorrect={handleCharacterCorrect}
            >
              <ModeDropdown mode={mode} onModeChange={setMode} gameType="kotoba" />
              <DistanceCounter value={counters[mode]} />
            </KotobaGameWindow>
          </>
        ) : (
          <>
            {showTrialBanner && (
              <PracticeBanner variant="kana" buttonLabel="Got it" onAction={markTrialBannerSeen}>
                You've finished the trial. Let's practice for real. Don't forget to{' '}
                <button
                  type="button"
                  onClick={openSignUp}
                  className="text-sage-500 font-medium hover:underline"
                >
                  sign up
                </button>{' '}
                to save your progress. :)
              </PracticeBanner>
            )}
            {showHiraganaSokuonHint && (
              <PracticeBanner variant="kana" buttonLabel="Got it" onAction={markHSokuonSeen}>
                This small っ (tsu) is a special character. It doubles the consonant that follows
                it. For example, きって is typed "kitte".
              </PracticeBanner>
            )}
            {showKatakanaSokuonHint && (
              <PracticeBanner variant="kana" buttonLabel="Got it" onAction={markKSokuonSeen}>
                This small ッ is the katakana version of っ. It works the same way, doubling the
                consonant that follows it. For example, ロッカー is typed "rokkaa".
              </PracticeBanner>
            )}
            {showLongVowelHint && (
              <PracticeBanner variant="kana" buttonLabel="Got it" onAction={markLongVowelSeen}>
                This ー is the long vowel mark. It stretches the vowel of the character before it.
                For example, カー sounds like "kaa". You'll only see it in katakana words.
              </PracticeBanner>
            )}
            <GameWindow
              key={kanaSession.prompt?.word.id ?? 'kana'}
              mode={mode}
              session={kanaSession}
              allowedCharIds={kanaSession.practiceIds}
              onCharacterCorrect={handleCharacterCorrect}
            >
              <ModeDropdown mode={mode} onModeChange={setMode} gameType="kana" />
              <DistanceCounter value={counters[mode]} />
            </GameWindow>
          </>
        )}
      </div>
    </div>
  )
}
