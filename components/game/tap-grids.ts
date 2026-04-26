// ─────────────────────────────────────────────
// File: components/game/tap-grids.ts
// Purpose: Shared tap grid character arrays for Kana and Kotoba
//          practice. Hiragana and katakana grids used by both
//          GameWindow and KotobaGameWindow.
// Depends on: nothing
// ─────────────────────────────────────────────

// ── Types ─────────────────────────────────────

export type TapCharacter = {
  readonly id: string
  readonly kana: string
  readonly romaji: string
}

// ── Kana helpers ──────────────────────────────

export function isKatakanaChar(kana: string): boolean {
  const code = kana.charCodeAt(0)
  return code >= 0x30a0 && code <= 0x30ff
}

export function toKatakana(str: string): string {
  return str.replace(/[぀-ゟ]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) + 0x60))
}

export function toHiragana(str: string): string {
  return str.replace(/[゠-ヿ]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60))
}

// ── Kotoba hiragana grid ─────────────────────

export const KOTOBA_HIRAGANA_TAP: readonly TapCharacter[] = [
  { id: 'h-i', kana: 'い', romaji: 'i' },
  { id: 'h-nu', kana: 'ぬ', romaji: 'nu' },
  { id: 'h-ho', kana: 'ほ', romaji: 'ho' },
  { id: 'h-n', kana: 'ん', romaji: 'n' },
  { id: 'h-mi', kana: 'み', romaji: 'mi' },
  { id: 'h-zu', kana: 'ず', romaji: 'zu' },
  { id: 'h-ya', kana: 'や', romaji: 'ya' },
  { id: 'h-ma', kana: 'ま', romaji: 'ma' },
  { id: 'h-hi', kana: 'ひ', romaji: 'hi' },
  { id: 'h-ta', kana: 'た', romaji: 'ta' },
]

// ── Kotoba katakana grid ─────────────────────

export const KOTOBA_KATAKANA_TAP: readonly TapCharacter[] = [
  { id: 'k-ko', kana: 'コ', romaji: 'ko' },
  { id: 'k-hi-k', kana: 'ヒ', romaji: 'hi' },
  { id: 'k-te', kana: 'テ', romaji: 'te' },
  { id: 'k-re', kana: 'レ', romaji: 're' },
  { id: 'k-bi', kana: 'ビ', romaji: 'bi' },
  { id: 'k-a', kana: 'ア', romaji: 'a' },
  { id: 'k-me', kana: 'メ', romaji: 'me' },
  { id: 'k-ri', kana: 'リ', romaji: 'ri' },
  { id: 'k-ka', kana: 'カ', romaji: 'ka' },
  { id: 'k-chouon', kana: 'ー', romaji: '-' },
]
