// ─────────────────────────────────────────────
// File: data/tutorial/dialogue-scripts.ts
// Purpose: Dialogue script data for the tutorial system.
//          Each script is an ordered array of messages keyed
//          by trigger ID. Content matches TUTORIAL_DIALOGUE.md.
// Depends on: nothing
// ─────────────────────────────────────────────

import type { MascotPose } from '@/components/game/dialogue-overlay'

// ── Types ─────────────────────────────────────

export type DialogueScript = {
  messages: string[]
  mascotPose: MascotPose
}

export type DialogueScriptTrigger =
  | 'kana-first-play'
  | 'kana-mode-tap'
  | 'kana-mode-swipe'
  | 'kana-mode-type'
  | 'kana-post-trial'
  | 'kotoba-first-tap'
  | 'kotoba-first-type'
  | 'kotoba-first-swipe'
  | 'unlock-milestone'
  | 'demo-kana-dojo'
  | 'demo-kotoba-dojo'
  | 'demo-home'
  | 'home-flame-prompt'

export type DialogueTrigger =
  | DialogueScriptTrigger
  | 'kana-trial-tap'
  | 'kana-trial-type'
  | 'kana-trial-swipe'
  | 'kana-trial-banner'
  | 'kotoba-trial-tap'
  | 'kotoba-trial-type'
  | 'kotoba-trial-swipe'
  | 'kotoba-intro-banner'
  | 'sokuon-hiragana-hint'
  | 'sokuon-katakana-hint'
  | 'longvowel-hint'
  | 'dual-mnemonic-hint'
  | 'dual-mnemonic-hint-2'

// ── Scripts ───────────────────────────────────

export const DIALOGUE_SCRIPTS: Record<DialogueScriptTrigger, DialogueScript> = {
  'kana-first-play': {
    mascotPose: 'neutral',
    messages: [
      'Welcome to LangTap, an app built to help you master typing and using a keyboard in a new language.',
      "Japanese has two phonetic alphabets: hiragana and katakana. Same sounds, different characters. You'll learn both.",
      "We'll start with hiragana, then introduce the katakana version of each group, so you learn them side by side.",
      "Characters are unlocked in consonant groups. You'll start with just a five.",
      'Get it right on the first try to earn distance (mastery points). The more you master a character, the less you see it.',
      'Characters you struggle with show up more often. The game adapts to your learning.',
      "You need to get the correct answer before you can move on. If you're stuck, we'll show you the answer after three attempts.",
      "You won't earn points for a corrected answer, but you're still learning.",
      "Once enough characters are unlocked, they'll start appearing in real Japanese words.",
      "The English meaning appears after each word. Tap anywhere to continue, or wait and it'll advance for you.",
      'The course progresses for you. All you need to do is play and be gently persistent.',
    ],
  },

  'kana-mode-tap': {
    mascotPose: 'neutral',
    messages: [
      'Tap the matching character on the grid to answer. Simple as that!',
      "Let's do a trial. We'll show you three hiragana characters and then one word they appear in, so you can give this a try. After that, you start for real.",
      "Try Swipe if you want to master using your mobile phone's keyboard, or Type for a computer keyboard. Or just stay here if you prefer an easier mode.",
    ],
  },

  'kana-mode-swipe': {
    mascotPose: 'neutral',
    messages: [
      "Swipe mode uses your phone's Japanese swipe keyboard. You'll need to add a Japanese keyboard in your phone settings first.",
      'The keyboard only shows hiragana. To answer in katakana, just swipe the hiragana equivalent and the keyboard will suggest the katakana.',
      "Let's do a trial. We'll show you a few kana characters and then some words they appear in, so you can give this a try. After that, you start for real.",
      "You can also try Tap for an easier on-screen grid, or Type if you're on a computer keyboard. Switch any time from the mode selector.",
    ],
  },

  'kana-mode-type': {
    mascotPose: 'neutral',
    messages: [
      'Type mode uses your physical keyboard. Type the romaji (English letters) for each hiragana or katakana character.',
      "For example, あ is 'a', き is 'ki', し is 'shi'. For katakana, type the same romaji and it will match automatically.",
      "Let's do a trial. We'll show you a few kana characters and then some words they appear in, so you can give this a try. After that, you start for real.",
      'You can also try Tap for an easier on-screen grid, or Swipe to practise with your mobile keyboard. Switch any time from the mode selector.',
    ],
  },

  'kana-post-trial': {
    mascotPose: 'thinking',
    messages: [
      'Before you dive in, here are a few things you can change in Settings.',
      'By default, prompts alternate between showing you kana and romaji. If you prefer one direction only, you can change this in Settings.',
      'You can also turn off hearing the word spoken, change the pacing, turn hints off, or turn on click sounds to mimic a keyboard.',
      "In your Profile, you'll be able to change the theme and font style (coming soon).",
    ],
  },

  'kotoba-first-tap': {
    mascotPose: 'neutral',
    messages: [
      'Welcome to Kotoba. Here you practise real Japanese words.',
      'You can answer in kana by tapping the correct reading on the grid.',
      'Or you can select the correct kanji word from the options we show you.',
      "Kanji answers earn 4x the mastery points, so you'll progress faster if you recognise the kanji.",
      'Words are unlocked in sets of 6. Once you answer enough correctly, the next set will unlock automatically.',
      "Let's try a few words so you can see how it works.",
    ],
  },

  'kotoba-first-type': {
    mascotPose: 'neutral',
    messages: [
      'Welcome to Kotoba. Here you practise real Japanese words.',
      'You can answer in kana by typing the reading with your keyboard.',
      'Or you can type the reading and select the kanji from the auto-suggestions on your Japanese keyboard.',
      "Kanji answers earn 4x the mastery points, so you'll progress faster if you recognise the kanji.",
      'Words are unlocked in sets of 6. Once you answer enough correctly, the next set will unlock automatically.',
      "Let's try a few words so you can see how it works.",
    ],
  },

  'kotoba-first-swipe': {
    mascotPose: 'neutral',
    messages: [
      'Welcome to Kotoba. Here you practise real Japanese words.',
      'You can answer in kana by swiping the reading on your keyboard.',
      'Or you can swipe the reading and select the kanji from the auto-suggestions on your Japanese keyboard.',
      "Kanji answers earn 4x the mastery points, so you'll progress faster if you recognise the kanji.",
      'Words are unlocked in sets of 6. Once you answer enough correctly, the next set will unlock automatically.',
      "Let's try a few words so you can see how it works.",
    ],
  },

  'unlock-milestone': {
    mascotPose: 'encouraging',
    messages: [
      "New characters unlocked! Your character pool is growing. Keep going and you'll start seeing them in words soon.",
    ],
  },

  'demo-kana-dojo': {
    mascotPose: 'neutral',
    messages: [
      'Welcome to the Kana Dojo! This is where you track your progress across all hiragana and katakana characters.',
      'Colours show your mastery level. Play around here, nothing will be saved.',
    ],
  },

  'demo-kotoba-dojo': {
    mascotPose: 'neutral',
    messages: [
      'This is the Kotoba Dojo. Words are grouped by JLPT level and unlock as you practise.',
      'Explore freely, this is just a preview.',
    ],
  },

  'demo-home': {
    mascotPose: 'neutral',
    messages: [
      'This is your dashboard. Your streak calendar, distance stats, and leaderboard position will all show here once you create an account.',
    ],
  },

  'home-flame-prompt': {
    mascotPose: 'encouraging',
    messages: [
      "Practice at least 10m to light today's flame on the calendar. Don't worry if you miss a day, we'll save you!",
    ],
  },
}
