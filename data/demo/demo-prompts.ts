// ─────────────────────────────────────────────
// File: data/demo/demo-prompts.ts
// Purpose: Curated fixed prompt sets for the demo taster experience.
//          Kana prompts walk through seion, katakana, dakuon,
//          combination, and special characters in a deterministic
//          sequence. Kotoba prompts cover common N5 vocabulary for
//          both readings and kanji input modes.
//          No randomness. No store writes. Static data only.
// Depends on: types/word.types.ts, hooks/usePracticeSession.ts,
//             types/kotoba.types.ts
// ─────────────────────────────────────────────

import type { WordBankEntry } from '@/types/word.types'
import type { PracticePrompt } from '@/hooks/usePracticeSession'
import type { KotobaPrompt } from '@/types/kotoba.types'

// ── Kana prompt builders ─────────────────────

function charPrompt(charId: string, kana: string, romaji: string): PracticePrompt {
  const word: WordBankEntry = {
    id: `demo-${charId}`,
    kana,
    kanji: null,
    meaning: ' ',
    jlptLevel: 'N5',
    characterIds: [charId],
    audioFile: null,
  }
  return {
    kind: 'character' as const,
    word,
    characters: [{ id: charId, kana, romaji }],
    targetCharacterId: charId,
  }
}

function wordPrompt(
  id: string,
  kana: string,
  kanji: string | null,
  meaning: string,
  chars: { id: string; kana: string; romaji: string }[],
): PracticePrompt {
  const word: WordBankEntry = {
    id,
    kana,
    kanji,
    meaning,
    jlptLevel: 'N5',
    characterIds: chars.map((c) => c.id),
    audioFile: null,
  }
  return { kind: 'word' as const, word, characters: chars, targetCharacterId: chars[0].id }
}

// ── Kana demo prompts (18 prompts) ───────────
// Sequence: hiragana seion chars, hiragana seion words, katakana chars,
// katakana words, dakuon words, combination words, special character
// words, capstone words.

export const DEMO_KANA_PROMPTS: readonly PracticePrompt[] = [
  // Hiragana seion character drills
  charPrompt('h-a', 'あ', 'a'),
  charPrompt('h-ka', 'か', 'ka'),
  charPrompt('h-sa', 'さ', 'sa'),

  // Hiragana seion word prompts
  wordPrompt('2013900', 'あか', '赤', 'Red', [
    { id: 'h-a', kana: 'あ', romaji: 'a' },
    { id: 'h-ka', kana: 'か', romaji: 'ka' },
  ]),
  wordPrompt('1194500', 'はな', '花', 'Flower', [
    { id: 'h-ha', kana: 'は', romaji: 'ha' },
    { id: 'h-na', kana: 'な', romaji: 'na' },
  ]),
  wordPrompt('1245290', 'そら', '空', 'Sky', [
    { id: 'h-so', kana: 'そ', romaji: 'so' },
    { id: 'h-ra', kana: 'ら', romaji: 'ra' },
  ]),

  // Katakana character drills
  charPrompt('k-ka', 'カ', 'ka'),
  charPrompt('k-te', 'テ', 'te'),

  // Katakana word prompts
  wordPrompt('1080510', 'テレビ', null, 'Television', [
    { id: 'k-te', kana: 'テ', romaji: 'te' },
    { id: 'k-re', kana: 'レ', romaji: 're' },
    { id: 'k-bi', kana: 'ビ', romaji: 'bi' },
  ]),
  wordPrompt('1038350', 'カメラ', null, 'Camera', [
    { id: 'k-ka', kana: 'カ', romaji: 'ka' },
    { id: 'k-me', kana: 'メ', romaji: 'me' },
    { id: 'k-ra', kana: 'ラ', romaji: 'ra' },
  ]),

  // Dakuon word prompts
  wordPrompt('1443840', 'でんわ', '電話', 'Telephone', [
    { id: 'h-de', kana: 'で', romaji: 'de' },
    { id: 'h-n', kana: 'ん', romaji: 'n' },
    { id: 'h-wa', kana: 'わ', romaji: 'wa' },
  ]),
  wordPrompt('1243490', 'ぎんこう', '銀行', 'Bank', [
    { id: 'h-gi', kana: 'ぎ', romaji: 'gi' },
    { id: 'h-n', kana: 'ん', romaji: 'n' },
    { id: 'h-ko', kana: 'こ', romaji: 'ko' },
    { id: 'h-u', kana: 'う', romaji: 'u' },
  ]),

  // Combination (yoon) word prompts
  wordPrompt('1002430', 'おちゃ', 'お茶', 'Green tea', [
    { id: 'h-o', kana: 'お', romaji: 'o' },
    { id: 'h-cha', kana: 'ちゃ', romaji: 'cha' },
  ]),
  wordPrompt('1321900', 'しゃしん', '写真', 'Photograph', [
    { id: 'h-sha', kana: 'しゃ', romaji: 'sha' },
    { id: 'h-shi', kana: 'し', romaji: 'shi' },
    { id: 'h-n', kana: 'ん', romaji: 'n' },
  ]),

  // Special character word prompts (sokuon and long vowel)
  wordPrompt('1206730', 'がっこう', '学校', 'School', [
    { id: 'h-ga', kana: 'が', romaji: 'ga' },
    { id: 'h-sokuon', kana: 'っ', romaji: 'k' },
    { id: 'h-ko', kana: 'こ', romaji: 'ko' },
    { id: 'h-u', kana: 'う', romaji: 'u' },
  ]),
  wordPrompt('1049180', 'コーヒー', null, 'Coffee', [
    { id: 'k-ko', kana: 'コ', romaji: 'ko' },
    { id: 'k-longvowel', kana: 'ー', romaji: 'o' },
    { id: 'k-hi', kana: 'ヒ', romaji: 'hi' },
    { id: 'k-longvowel', kana: 'ー', romaji: 'i' },
  ]),

  // Capstone word prompts
  wordPrompt('1578010', 'さかな', '魚', 'Fish', [
    { id: 'h-sa', kana: 'さ', romaji: 'sa' },
    { id: 'h-ka', kana: 'か', romaji: 'ka' },
    { id: 'h-na', kana: 'な', romaji: 'na' },
  ]),
  wordPrompt('1467640', 'ねこ', '猫', 'Cat', [
    { id: 'h-ne', kana: 'ね', romaji: 'ne' },
    { id: 'h-ko', kana: 'こ', romaji: 'ko' },
  ]),
]

// ── Tap grid character IDs for demo ──────────
// All characters that appear in demo kana prompts. Used to populate the
// tap grid during demo mode so no unfamiliar characters are shown.

export const DEMO_ALLOWED_IDS: readonly string[] = [
  // Hiragana seion
  'h-a', 'h-ka', 'h-sa', 'h-ha', 'h-na', 'h-so', 'h-ra',
  'h-o', 'h-u', 'h-ne', 'h-ko', 'h-wa', 'h-n', 'h-shi',
  // Hiragana dakuon
  'h-de', 'h-gi', 'h-ga',
  // Hiragana combination
  'h-cha', 'h-sha',
  // Hiragana special
  'h-sokuon',
  // Katakana seion
  'k-ka', 'k-te', 'k-re', 'k-me', 'k-ra', 'k-ko', 'k-hi',
  // Katakana dakuon
  'k-bi',
  // Katakana special
  'k-longvowel',
]

// ── Kotoba demo prompts (8 prompts) ──────────
// Common N5 vocabulary. Used for both readings mode (type the kana)
// and kanji mode (select the kanji). Deterministic sequence.

export const DEMO_KOTOBA_PROMPTS: readonly KotobaPrompt[] = [
  {
    id: '1371260',
    kanji: '水',
    kana: 'みず',
    english: 'Water',
    characters: [
      { kana: 'み', romaji: 'mi' },
      { kana: 'ず', romaji: 'zu' },
    ],
  },
  {
    id: '1302680',
    kanji: '山',
    kana: 'やま',
    english: 'Mountain',
    characters: [
      { kana: 'や', romaji: 'ya' },
      { kana: 'ま', romaji: 'ma' },
    ],
  },
  {
    id: '1194500',
    kanji: '花',
    kana: 'はな',
    english: 'Flower',
    characters: [
      { kana: 'は', romaji: 'ha' },
      { kana: 'な', romaji: 'na' },
    ],
  },
  {
    id: '1467640',
    kanji: '猫',
    kana: 'ねこ',
    english: 'Cat',
    characters: [
      { kana: 'ね', romaji: 'ne' },
      { kana: 'こ', romaji: 'ko' },
    ],
  },
  {
    id: '2013900',
    kanji: '赤',
    kana: 'あか',
    english: 'Red',
    characters: [
      { kana: 'あ', romaji: 'a' },
      { kana: 'か', romaji: 'ka' },
    ],
  },
  {
    id: '1522150',
    kanji: '本',
    kana: 'ほん',
    english: 'Book',
    characters: [
      { kana: 'ほ', romaji: 'ho' },
      { kana: 'ん', romaji: 'n' },
    ],
  },
  {
    id: '1578010',
    kanji: '魚',
    kana: 'さかな',
    english: 'Fish',
    characters: [
      { kana: 'さ', romaji: 'sa' },
      { kana: 'か', romaji: 'ka' },
      { kana: 'な', romaji: 'na' },
    ],
  },
  {
    id: '1390020',
    kanji: '川',
    kana: 'かわ',
    english: 'River',
    characters: [
      { kana: 'か', romaji: 'ka' },
      { kana: 'わ', romaji: 'wa' },
    ],
  },
]

// ── Counts ───────────────────────────────────

export const DEMO_KANA_PROMPT_COUNT: number = DEMO_KANA_PROMPTS.length
export const DEMO_KOTOBA_PROMPT_COUNT: number = DEMO_KOTOBA_PROMPTS.length
export const DEMO_TOTAL_PROMPT_COUNT: number = DEMO_KANA_PROMPT_COUNT + DEMO_KOTOBA_PROMPT_COUNT
