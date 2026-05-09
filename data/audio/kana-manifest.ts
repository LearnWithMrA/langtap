// ─────────────────────────────────────────────
// File: data/audio/kana-manifest.ts
// Purpose: Manifest of individual kana character audio files.
//          Maps kana strings to audio paths in public/audio/kana/.
//          Katakana characters without their own file fall back to
//          the hiragana equivalent (same pronunciation).
// Depends on: nothing
// ─────────────────────────────────────────────

// ── Audio file set ──────────────────────────────

const KANA_AUDIO_FILES = new Set([
  // Seion hiragana
  'あ',
  'い',
  'う',
  'え',
  'お',
  'か',
  'き',
  'く',
  'け',
  'こ',
  'さ',
  'し',
  'す',
  'せ',
  'そ',
  'た',
  'ち',
  'つ',
  'て',
  'と',
  'な',
  'に',
  'ぬ',
  'ね',
  'の',
  'は',
  'ひ',
  'ふ',
  'へ',
  'ほ',
  'ま',
  'み',
  'む',
  'め',
  'も',
  'や',
  'ゆ',
  'よ',
  'ら',
  'り',
  'る',
  'れ',
  'ろ',
  'わ',
  'を',
  'ん',

  // Dakuon hiragana
  'が',
  'ぎ',
  'ぐ',
  'げ',
  'ご',
  'ざ',
  'じ',
  'ず',
  'ぜ',
  'ぞ',
  'だ',
  'ぢ',
  'づ',
  'で',
  'ど',
  'ば',
  'び',
  'ぶ',
  'べ',
  'ぼ',
  'ぱ',
  'ぴ',
  'ぷ',
  'ぺ',
  'ぽ',

  // Combination hiragana
  'きゃ',
  'きゅ',
  'きょ',
  'しゃ',
  'しゅ',
  'しょ',
  'ちゃ',
  'ちゅ',
  'ちょ',
  'にゃ',
  'にゅ',
  'にょ',
  'ひゃ',
  'ひゅ',
  'ひょ',
  'みゃ',
  'みゅ',
  'みょ',
  'りゃ',
  'りゅ',
  'りょ',
  'ぎゃ',
  'ぎゅ',
  'ぎょ',
  'じゃ',
  'じゅ',
  'じょ',
  'びゃ',
  'びゅ',
  'びょ',

  // Extended katakana (unique sounds with no hiragana equivalent)
  'ヴァ',
  'ヴィ',
  'ヴェ',
  'ヴォ',
  'ウィ',
  'ウェ',
  'ウォ',
  'ジェ',
  'シェ',
  'チェ',
  'ツァ',
  'ツィ',
  'ツェ',
  'ツォ',
  'ディ',
  'ティ',
  'ドゥ',
  'トゥ',
  'ファ',
  'フィ',
  'フェ',
  'フォ',
])

// ── Helpers ─────────────────────────────────────

function toHiragana(str: string): string {
  return str.replace(/[゠-ヿ]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60))
}

export function getKanaAudioPath(kana: string): string | null {
  if (KANA_AUDIO_FILES.has(kana)) return `/audio/kana/${encodeURIComponent(kana)}.mp3`
  const hiragana = toHiragana(kana)
  if (hiragana !== kana && KANA_AUDIO_FILES.has(hiragana)) {
    return `/audio/kana/${encodeURIComponent(hiragana)}.mp3`
  }
  return null
}
