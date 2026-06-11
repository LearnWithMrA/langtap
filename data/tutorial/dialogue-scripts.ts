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
      'Welcome to LangTap! This game builds one skill: typing Japanese without thinking.',
      "Japanese has two phonetic alphabets, hiragana and katakana. Same sounds, different shapes. You'll learn them side by side.",
      'We start with hiragana, adding the katakana versions group by group as you go.',
      'Answer on the first try to earn distance points. Tricky characters come back more often and easy ones fade away, just until you need them again.',
      'Wrong answers cost nothing. After three tries we show the answer and move on.',
      "Once you've learned enough characters, they start appearing in real Japanese words.",
      "That's everything. The game handles the rest, just keep pedalling.",
    ],
  },

  'kana-mode-tap': {
    mascotPose: 'neutral',
    messages: [
      "Tap mode: tap the matching character on the grid. That's it.",
      "Let's warm up with a quick trial round, then you start for real.",
      'Prefer your phone keyboard? Try Swipe. On a computer? Try Type. Switch any time from the mode icon.',
    ],
  },

  'kana-mode-swipe': {
    mascotPose: 'neutral',
    messages: [
      "Swipe mode uses your phone's Japanese keyboard. Add one in your phone settings if you haven't yet.",
      'The keyboard shows hiragana only. For katakana, swipe the hiragana and pick the katakana suggestion.',
      "Let's warm up with a quick trial round, then you start for real.",
    ],
  },

  'kana-mode-type': {
    mascotPose: 'neutral',
    messages: [
      "Type mode: type the romaji for each character. あ is 'a', き is 'ki', し is 'shi'.",
      'Katakana works the same way: same romaji, matched automatically.',
      "Let's warm up with a quick trial round, then you start for real.",
    ],
  },

  'kana-post-trial': {
    mascotPose: 'thinking',
    messages: [
      'Nice! One last thing: the gear icon opens Settings.',
      'There you can fix the prompt direction, change the pacing, and toggle hints, audio, and key clicks.',
    ],
  },

  'kotoba-first-tap': {
    mascotPose: 'neutral',
    messages: [
      'Welcome to Kotoba: where you learn how to type Japanese words.',
      'Answer in kana on the grid, or pick the matching kanji from the options.',
      'Kanji answers earn 4x the distance. Words unlock in small sets as you master them.',
      "Let's try a few.",
    ],
  },

  'kotoba-first-type': {
    mascotPose: 'neutral',
    messages: [
      'Welcome to Kotoba: where you learn how to type Japanese words.',
      "Type the reading in kana, or answer in kanji using your Japanese keyboard's suggestions.",
      'Kanji answers earn 4x the distance. Words unlock in small sets as you master them.',
      "Let's try a few.",
    ],
  },

  'kotoba-first-swipe': {
    mascotPose: 'neutral',
    messages: [
      'Welcome to Kotoba: where you learn how to type Japanese words.',
      "Swipe the reading in kana, or answer in kanji using your keyboard's suggestions.",
      'Kanji answers earn 4x the distance. Words unlock in small sets as you master them.',
      "Let's try a few.",
    ],
  },

  'unlock-milestone': {
    mascotPose: 'encouraging',
    messages: ["New characters unlocked! Keep going and they'll start showing up in words."],
  },

  'demo-kana-dojo': {
    mascotPose: 'neutral',
    messages: [
      'This is the Kana Dojo: your progress map for every character. Warmer colours mean stronger mastery.',
      'Poke around freely, nothing is saved in the demo.',
    ],
  },

  'demo-kotoba-dojo': {
    mascotPose: 'neutral',
    messages: [
      'The Kotoba Dojo tracks words by JLPT level. They unlock as you practise.',
      'Explore freely, this is just a preview.',
    ],
  },

  'demo-home': {
    mascotPose: 'neutral',
    messages: [
      'This is your dashboard. Your streak calendar, stats, and leaderboard spot will live here once you have an account.',
    ],
  },

  'home-flame-prompt': {
    mascotPose: 'encouraging',
    messages: [
      "Practise at least 10m today to light a flame on your calendar. Miss a day? We'll save your streak!",
    ],
  },
}
