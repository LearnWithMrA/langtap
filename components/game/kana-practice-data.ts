// ─────────────────────────────────────────────
// File: components/game/kana-practice-data.ts
// Purpose: Mock word data, tap grids, and helpers for the Kana
//          practice visual shell. Replaced by real engine in Sprint 4-5.
// Depends on: nothing
// ─────────────────────────────────────────────

// ── Types ─────────────────────────────────────

type MockCharacter = {
  kana: string
  romaji: string
}

export type MockWord = {
  word: string
  meaning: string
  characters: MockCharacter[]
}

// ── Mock data ─────────────────────────────────

export const MOCK_WORDS: MockWord[] = [
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

export const HIRAGANA_TAP = [
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

export const KATAKANA_TAP = [
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
export function isKatakanaWord(word: MockWord): boolean {
  const code = word.characters[0].kana.charCodeAt(0)
  return code >= 0x30a0 && code <= 0x30ff
}

// Convert hiragana to katakana (fixed Unicode offset of 0x60)
export function toKatakana(str: string): string {
  return str.replace(/[\u3040-\u309F]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) + 0x60))
}
