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

import { useCallback, useEffect, useRef, useState } from 'react'
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
import { useDailyCap } from '@/hooks/useDailyCap'
import { useStuckLoadingWarning } from '@/hooks/useStuckLoadingWarning'
import { usePracticeActivityTracker } from '@/hooks/usePracticeActivityTracker'
import { useSettingsStore } from '@/stores/settings.store'
import { useAuthModalStore } from '@/stores/auth-modal.store'
import { useUserStore } from '@/stores/user.store'
import { useOnboardingStore } from '@/stores/onboarding.store'
import { useGameplayStore } from '@/stores/gameplay.store'
import { useSessionStore } from '@/stores/session.store'
import { startLeaderboardSession, finalizeLeaderboardSession } from '@/services/leaderboard.service'
import type { LeaderboardAttemptEntry, PendingSession } from '@/types/leaderboard.types'
import { DIALOGUE_SCRIPTS } from '@/data/tutorial/dialogue-scripts'
import { TRIAL_ALLOWED_IDS } from '@/data/tutorial/trial-prompts'
import { hasDemoBeenCompleted } from '@/components/layout/demo-practice-client'

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

// -- Daily capped shell (signed-in user hit daily limit) -----

function DailyCappedShell(): ReactNode {
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
      <div className="mt-6 text-center px-4">
        <p className="text-sm text-warm-600 font-medium">
          {"You've been crushing it today! Come back tomorrow to keep going."}
        </p>
      </div>
    </PracticeScene>
  )
}

// -- Active practice (hooks mounted only when not capped) ---

function ActivePracticeClient({ gameType }: { gameType: GameType }): ReactNode {
  const mode = useSettingsStore((s) => s.inputMode) as InputMode
  const setMode = useSettingsStore((s) => s.setInputMode)
  const kotobaInput = useSettingsStore((s) => s.kotobaInput)
  const { counters, incrementCorrect } = usePracticeCounters(gameType)
  const profileLevel = useUserStore((s) => s.profile?.jlptLevel)
  const onboardingLevel = useOnboardingStore((s) => s.jlptLevel)
  const resolvedLevel = profileLevel ?? onboardingLevel ?? 'N5'
  const kanaSession = usePracticeSession(resolvedLevel)
  const trialSession = useTutorialTrial()
  const kotobaTrialSession = useKotobaTrialSession()
  const { isGuest } = useAuth()
  const openSignUp = useAuthModalStore((s) => s.openSignUp)
  const { trackCompletion } = usePracticeActivityTracker(isGuest)

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

  const trialProceedLabel = hasDemoBeenCompleted() ? 'Redo tutorial' : undefined

  const kanaDialogue =
    gameType === 'kana'
      ? !hasSeenKanaIntro
        ? {
            script: DIALOGUE_SCRIPTS['kana-first-play'],
            onDismiss: markKanaIntroSeen,
            theme: 'blue' as const,
            onSkip: undefined as (() => void) | undefined,
            skipLabel: undefined as string | undefined,
            dismissLabel: undefined as string | undefined,
          }
        : !hasSeenSettings
          ? {
              script: DIALOGUE_SCRIPTS['kana-post-trial'],
              onDismiss: markSettingsSeen,
              theme: 'blue' as const,
              onSkip: undefined,
              skipLabel: undefined,
              dismissLabel: undefined,
            }
          : !hasSeenKanaMode
            ? {
                script: DIALOGUE_SCRIPTS[kanaModeKey],
                onDismiss: markKanaModeSeen,
                theme: 'blue' as const,
                onSkip: skipTrial,
                skipLabel: 'Skip trial',
                dismissLabel: trialProceedLabel,
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
          dismissLabel: trialProceedLabel,
        }
      : null

  const activeDialogue = kanaDialogue ?? kotobaDialogue

  // ── Trial round gate ────────────────────────
  const showKanaTrial = gameType === 'kana' && !activeDialogue && !hasSeenTrial
  const showKotobaTrial = gameType === 'kotoba' && !activeDialogue && !hasSeenKotobaTrial

  // ── Post-trial / post-kotoba banners ────────
  const showTrialBanner =
    gameType === 'kana' && isGuest && hasSeenTrial && !hasSeenTrialBanner && !activeDialogue
  const showKotobaBanner =
    gameType === 'kotoba' &&
    isGuest &&
    hasSeenKotobaTrial &&
    !hasSeenKotobaBanner &&
    !activeDialogue

  // ── Daily distance cap tracking ─────────────
  const { increment: incrementDailyCap } = useDailyCap()
  const completionIdRef = useRef(crypto.randomUUID())
  const distanceBeforePromptRef = useRef(0)

  // Reset completion tracking when prompt changes (covers words + character drills)
  const currentPromptId = kanaSession.prompt?.word?.id ?? null
  useEffect(() => {
    completionIdRef.current = crypto.randomUUID()
    distanceBeforePromptRef.current = useSessionStore.getState().distanceMetres
  }, [currentPromptId])

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

  const handleCharacterCorrect = useCallback(
    (characterCount: number = 1): void => {
      incrementCorrect(mode)
      trackCompletion(characterCount)
      if (!isGuest) {
        const promptMetres =
          useSessionStore.getState().distanceMetres - distanceBeforePromptRef.current
        if (promptMetres > 0) {
          void incrementDailyCap(promptMetres, completionIdRef.current)
        }
      }
    },
    [incrementCorrect, mode, trackCompletion, isGuest, incrementDailyCap],
  )

  const sessionMapRef = useRef(new Map<string, PendingSession>())

  const handleLeaderboardStart = useCallback(
    (promptId: string, wordId: string): void => {
      if (isGuest) return
      sessionMapRef.current.set(promptId, {
        wordId,
        sessionId: null,
        pendingAttempts: null,
      })
      void startLeaderboardSession({
        gameType,
        inputMode: mode,
        wordId,
        kotobaInput: gameType === 'kotoba' ? kotobaInput : null,
      }).then((result) => {
        const entry = sessionMapRef.current.get(promptId)
        if (!entry) return
        if (!result.ok || !result.data) {
          sessionMapRef.current.delete(promptId)
          return
        }
        entry.sessionId = result.data
        if (entry.pendingAttempts) {
          const attempts = entry.pendingAttempts
          sessionMapRef.current.delete(promptId)
          void finalizeLeaderboardSession({ sessionId: result.data, attempts })
        }
      })
    },
    [isGuest, gameType, mode, kotobaInput],
  )

  const handleLeaderboardFinalize = useCallback(
    (promptId: string, attempts: LeaderboardAttemptEntry[]): void => {
      const entry = sessionMapRef.current.get(promptId)
      if (!entry) return
      if (entry.sessionId) {
        sessionMapRef.current.delete(promptId)
        void finalizeLeaderboardSession({ sessionId: entry.sessionId, attempts })
      } else {
        entry.pendingAttempts = attempts
      }
    },
    [],
  )

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
          dismissLabel={activeDialogue.dismissLabel}
        />
      ) : showKanaTrial && !trialSession.isComplete ? (
        <GameWindow
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
            onLeaderboardStart={handleLeaderboardStart}
            onLeaderboardFinalize={handleLeaderboardFinalize}
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
            mode={mode}
            session={kanaSession}
            allowedCharIds={kanaSession.practiceIds}
            onCharacterCorrect={handleCharacterCorrect}
            onMnemonicShown={handleMnemonicShown}
            onLeaderboardStart={handleLeaderboardStart}
            onLeaderboardFinalize={handleLeaderboardFinalize}
          >
            <ModeDropdown mode={mode} onModeChange={setMode} gameType="kana" />
            <DistanceCounter value={counters[mode]} />
          </GameWindow>
        </>
      )}
    </PracticeScene>
  )
}

// -- Practice error shell ──────────────────────

const STUCK_TIMEOUT_MS = 8000

function PracticeErrorShell({ stuckGate }: { stuckGate: string }): ReactNode {
  return (
    <PracticeScene>
      <div
        role="alert"
        className="bg-[#faf5e4] shadow-[0_6px_0_0_#d4c9b0] rounded-2xl w-full max-w-md mx-auto p-6"
      >
        <p className="text-base font-medium text-warm-800 mb-2">
          Something went wrong loading the game.
        </p>
        <p className="text-sm text-warm-500 mb-4">
          Error code: <span className="font-mono font-bold">{stuckGate}</span>
        </p>
        <button
          type="button"
          onClick={(): void => window.location.reload()}
          className="bg-sage-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-sage-600 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-500"
        >
          Retry
        </button>
      </div>
    </PracticeScene>
  )
}

// -- Exported wrapper (cap gate before hooks) ──

export function PracticeClient({ gameType = 'kana' }: { gameType?: GameType }): ReactNode {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const { isLoading: dailyCapLoading, isCapped: isDailyCapped } = useDailyCap()
  const isProfileLoaded = useUserStore((s) => s.isProfileLoaded)
  const isServerHydrated = useUserStore((s) => s.isServerHydrated)
  const [stuckGate, setStuckGate] = useState<string | null>(null)

  useStuckLoadingWarning({ authLoading, dailyCapLoading }, 'PracticeClient')

  const isBlocked =
    authLoading || (isAuthenticated && (dailyCapLoading || !isProfileLoaded || !isServerHydrated))

  useEffect(() => {
    if (!isBlocked) {
      setStuckGate(null)
      return
    }

    const timer = setTimeout(() => {
      if (authLoading) setStuckGate('AUTH_LOADING')
      else if (dailyCapLoading) setStuckGate('DAILY_CAP')
      else if (!isProfileLoaded) setStuckGate('PROFILE_LOAD')
      else if (!isServerHydrated) setStuckGate('SERVER_HYDRATION')
    }, STUCK_TIMEOUT_MS)

    return (): void => clearTimeout(timer)
  }, [isBlocked, authLoading, dailyCapLoading, isProfileLoaded, isServerHydrated])

  if (stuckGate) return <PracticeErrorShell stuckGate={stuckGate} />
  if (authLoading) return <PracticeScene>{null}</PracticeScene>
  if (isAuthenticated && dailyCapLoading) return <PracticeScene>{null}</PracticeScene>
  if (isAuthenticated && !isProfileLoaded) return <PracticeScene>{null}</PracticeScene>
  if (isAuthenticated && !isServerHydrated) return <PracticeScene>{null}</PracticeScene>
  if (isAuthenticated && isDailyCapped) return <DailyCappedShell />
  return <ActivePracticeClient gameType={gameType} />
}
