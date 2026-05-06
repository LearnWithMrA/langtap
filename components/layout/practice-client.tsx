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
import dynamic from 'next/dynamic'
import { GameWindow } from '@/components/game/game-window'

const LazyKotobaGameWindow = dynamic(
  () =>
    import('@/components/game/kotoba-game-window').then((mod) => ({
      default: mod.KotobaGameWindow,
    })),
  { loading: () => null },
)
import { DistanceCounter } from '@/components/game/distance-counter'
import { DialogueOverlay } from '@/components/game/dialogue-overlay'
import { PracticeBanner } from '@/components/game/practice-banner'
import { useKeySound } from '@/hooks/useKeySound'
import { usePracticeCounters } from '@/hooks/usePracticeCounters'
import { usePracticeSession } from '@/hooks/usePracticeSession'
import { useTutorialTrial } from '@/hooks/useTutorialTrial'
import { useKotobaTrialSession } from '@/hooks/useKotobaTrialSession'
import { useDialogueSeen } from '@/hooks/useDialogueSeen'
import { useAuth } from '@/hooks/useAuth'
import { useGuestUsage } from '@/hooks/useGuestUsage'
import { useStuckLoadingWarning } from '@/hooks/useStuckLoadingWarning'
import { useSettingsStore } from '@/stores/settings.store'
import { useAuthModalStore } from '@/stores/auth-modal.store'
import { useUserStore } from '@/stores/user.store'
import { useOnboardingStore } from '@/stores/onboarding.store'
import { useGameplayStore } from '@/stores/gameplay.store'
import { DIALOGUE_SCRIPTS } from '@/data/tutorial/dialogue-scripts'
import { TRIAL_ALLOWED_IDS } from '@/data/tutorial/trial-prompts'

const TRIAL_ALLOWED_SET = new Set(TRIAL_ALLOWED_IDS)
const KANA_TRIAL_CARD = 'bg-[#dce8f5] shadow-[0_6px_0_0_#a8bed8]'
const KOTOBA_TRIAL_CARD = 'bg-[#ddf0e8] shadow-[0_6px_0_0_#a0d0b8]'
const FROZEN_PROMPT_KEY = 'langtap-frozen-prompt'

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

// -- Scene shell (shared between active and capped) ---------

function PracticeScene({
  children,
  hasBanner,
}: {
  children: ReactNode
  hasBanner?: boolean
}): ReactNode {
  return (
    <div className="h-svh overflow-hidden">
      <div
        className={[
          'absolute left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-full max-w-lg px-4',
          hasBanner ? 'top-[40%]' : 'top-[34%]',
        ].join(' ')}
      >
        {children}
      </div>
    </div>
  )
}

// -- Capped shell (no practice hooks mounted) ---------------

function CappedPracticeShell(): ReactNode {
  const frozen =
    typeof window !== 'undefined' ? (localStorage.getItem(FROZEN_PROMPT_KEY) ?? 'あ') : 'あ'

  return (
    <PracticeScene>
      <div className="opacity-50 pointer-events-none">
        <div className="bg-[#faf5e4] shadow-[0_6px_0_0_#d4c9b0] rounded-2xl w-full max-w-md mx-auto p-6 md:p-8">
          <div className="text-5xl md:text-6xl font-bold text-center py-6 select-none text-warm-400">
            {frozen}
          </div>
          <div className="text-base text-warm-400 text-center min-h-6">&nbsp;</div>
        </div>
      </div>
    </PracticeScene>
  )
}

// -- Active practice (hooks mounted only when not capped) ---

function ActivePracticeClient({ gameType }: { gameType: GameType }): ReactNode {
  const [mode, setMode] = useState<InputMode>('tap')
  const kotobaInput = useSettingsStore((s) => s.kotobaInput)
  const { counters, incrementCorrect } = usePracticeCounters()
  const profileLevel = useUserStore((s) => s.profile?.jlptLevel)
  const onboardingLevel = useOnboardingStore((s) => s.jlptLevel)
  const resolvedLevel = profileLevel ?? onboardingLevel ?? 'N5'
  const kanaSession = usePracticeSession(resolvedLevel)
  const trialSession = useTutorialTrial()
  const kotobaTrialSession = useKotobaTrialSession()
  const { isGuest } = useAuth()
  const openSignUp = useAuthModalStore((s) => s.openSignUp)

  useEffect(() => {
    useGameplayStore.getState().setActive(true)
    return (): void => {
      useGameplayStore.getState().setActive(false)
    }
  }, [])

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
            theme: 'blue' as const,
            onSkip: undefined as (() => void) | undefined,
            skipLabel: undefined as string | undefined,
          }
        : !hasSeenSettings
          ? {
              script: DIALOGUE_SCRIPTS['kana-post-trial'],
              onDismiss: markSettingsSeen,
              theme: 'blue' as const,
              onSkip: undefined,
              skipLabel: undefined,
            }
          : !hasSeenKanaMode
            ? {
                script: DIALOGUE_SCRIPTS[kanaModeKey],
                onDismiss: markKanaModeSeen,
                theme: 'blue' as const,
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
          theme: 'green' as const,
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

  // ── Guest distance tracking (server-side) ───
  const { increment: incrementGuestDistance } = useGuestUsage()

  // Cache current prompt so the capped shell can show it frozen
  useEffect(() => {
    const prompt = gameType === 'kana' ? kanaSession.prompt : null
    if (prompt) {
      const chars = prompt.characters.map((c) => c.kana).join('')
      localStorage.setItem(FROZEN_PROMPT_KEY, chars)
    }
  }, [gameType, kanaSession.prompt])

  useEffect(() => {
    if (trialSession.isComplete && !hasSeenTrial) markTrialSeen()
  }, [trialSession.isComplete, hasSeenTrial, markTrialSeen])

  useEffect(() => {
    if (kotobaTrialSession.isComplete && !hasSeenKotobaTrial) markKotobaTrialSeen()
  }, [kotobaTrialSession.isComplete, hasSeenKotobaTrial, markKotobaTrialSeen])

  // ── Dual mnemonic banners (two-part, triggered by wrong answer) ──
  const { hasSeen: hasSeenMnemonicBanner1, markSeen: markMnemonicBanner1Seen } =
    useDialogueSeen('dual-mnemonic-hint')
  const { hasSeen: hasSeenMnemonicBanner2, markSeen: markMnemonicBanner2Seen } =
    useDialogueSeen('dual-mnemonic-hint-2')
  const [mnemonicShown, setMnemonicShown] = useState(false)
  const handleMnemonicShown = useCallback((): void => setMnemonicShown(true), [])

  // ── Special character hints ──────────────────
  const { hasSeen: hasSeenHSokuon, markSeen: markHSokuonSeen } =
    useDialogueSeen('sokuon-hiragana-hint')
  const { hasSeen: hasSeenKSokuon, markSeen: markKSokuonSeen } =
    useDialogueSeen('sokuon-katakana-hint')
  const { hasSeen: hasSeenLongVowel, markSeen: markLongVowelSeen } =
    useDialogueSeen('longvowel-hint')

  const hintsEnabled = useSettingsStore((s) => s.hints)
  const showMnemonicBanner1 =
    mnemonicShown &&
    !hasSeenMnemonicBanner1 &&
    !activeDialogue &&
    !showKanaTrial &&
    gameType === 'kana' &&
    hintsEnabled
  const showMnemonicBanner2 =
    hasSeenMnemonicBanner1 &&
    !hasSeenMnemonicBanner2 &&
    !activeDialogue &&
    !showKanaTrial &&
    gameType === 'kana' &&
    hintsEnabled &&
    mnemonicShown

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
      void incrementGuestDistance(gameType, 1)
    }
  }, [incrementCorrect, mode, isGuest, incrementGuestDistance, gameType])

  const hasBanner =
    showKotobaBanner ||
    showTrialBanner ||
    showMnemonicBanner1 ||
    showMnemonicBanner2 ||
    showHiraganaSokuonHint ||
    showKatakanaSokuonHint ||
    showLongVowelHint

  return (
    <PracticeScene hasBanner={hasBanner}>
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
        <LazyKotobaGameWindow
          key={kotobaTrialSession.prompt?.id ?? 'kotoba-trial'}
          mode={mode}
          kotobaInput={kotobaInput}
          session={kotobaTrialSession}
          cardClassName={KOTOBA_TRIAL_CARD}
        >
          <ModeDropdown mode={mode} onModeChange={setMode} gameType="kotoba" />
          <span className="text-base font-bold text-[#4a6a8a] tracking-wider">Trial</span>
        </LazyKotobaGameWindow>
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
          <LazyKotobaGameWindow
            mode={mode}
            kotobaInput={kotobaInput}
            jlptLevel={resolvedLevel}
            onCharacterCorrect={handleCharacterCorrect}
          >
            <ModeDropdown mode={mode} onModeChange={setMode} gameType="kotoba" />
            <DistanceCounter value={counters[mode]} />
          </LazyKotobaGameWindow>
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
          {showMnemonicBanner1 && (
            <PracticeBanner variant="kana" buttonLabel="Got it" onAction={markMnemonicBanner1Seen}>
              These are dual mnemonics. They link hiragana and katakana pairs through a shared
              story. Get an answer wrong and one will appear.
            </PracticeBanner>
          )}
          {showMnemonicBanner2 && (
            <PracticeBanner variant="kana" buttonLabel="Got it" onAction={markMnemonicBanner2Seen}>
              We recommend writing them down and creating your own dual hiragana/katakana chart.
            </PracticeBanner>
          )}
          {showHiraganaSokuonHint && (
            <PracticeBanner variant="kana" buttonLabel="Got it" onAction={markHSokuonSeen}>
              This small っ (tsu) is a special character. It doubles the consonant that follows it.
              For example, きって is typed "kitte".
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
              This ー is the long vowel mark. It stretches the vowel of the character before it. For
              example, カー sounds like "kaa". You'll only see it in katakana words.
            </PracticeBanner>
          )}
          <GameWindow
            key={kanaSession.prompt?.word.id ?? 'kana'}
            mode={mode}
            session={kanaSession}
            allowedCharIds={kanaSession.practiceIds}
            onCharacterCorrect={handleCharacterCorrect}
            onMnemonicShown={handleMnemonicShown}
          >
            <ModeDropdown mode={mode} onModeChange={setMode} gameType="kana" />
            <DistanceCounter value={counters[mode]} />
          </GameWindow>
        </>
      )}
    </PracticeScene>
  )
}

// -- Exported wrapper (cap gate before hooks) ──

export function PracticeClient({ gameType = 'kana' }: { gameType?: GameType }): ReactNode {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const { isLoading: usageLoading, isOverCap } = useGuestUsage()
  const isProfileLoaded = useUserStore((s) => s.isProfileLoaded)

  useStuckLoadingWarning({ authLoading, usageLoading }, 'PracticeClient')

  if (authLoading || usageLoading) return <PracticeScene>{null}</PracticeScene>
  if (isAuthenticated && !isProfileLoaded) return <PracticeScene>{null}</PracticeScene>
  if (isAuthenticated) return <ActivePracticeClient gameType={gameType} />
  if (isOverCap) return <CappedPracticeShell />
  return <ActivePracticeClient gameType={gameType} />
}
