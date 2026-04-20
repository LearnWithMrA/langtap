// ─────────────────────────────────────────────
// File: data/kana/characters.ts
// Purpose: Full kana character dataset. Single source of truth for every
//          hiragana and katakana character in Phase 1. Covers seion, dakuon,
//          and yoon across both scripts. ~208 entries total.
//          IDs are stable and must never change once assigned. Components,
//          fixtures, and persisted state all reference characters by id.
//          Romaji is Hepburn (shi, chi, tsu, fu, sha, ja, cha).
//          Where Hepburn collides (じ/ぢ → "ji", ず/づ → "zu") the id uses
//          a Kunrei-style suffix: h-ji/h-di, h-zu/h-du (and k- variants).
//          The chart layout (row + column) matches the gojuon grid. Rows
//          with gaps (ya, wa, n) simply do not populate missing columns;
//          the UI renders empty cells.
// Depends on: types/kana.types.ts
// ─────────────────────────────────────────────

import type { KanaCharacter, Script, Stage } from '@/types/kana.types'

// ── Types ─────────────────────────────────────

// Tuple form used inside the builder: [kana, romaji, row, column, idSuffix?]
// `idSuffix` overrides the id romaji when Hepburn collides (e.g. ぢ → 'di').
type Entry =
  | readonly [string, string, string, string]
  | readonly [string, string, string, string, string]

// ── Helpers ───────────────────────────────────

// Builds a set of KanaCharacter records for one (stage, script) bucket.
function build(stage: Stage, script: Script, entries: readonly Entry[]): KanaCharacter[] {
  const prefix = script === 'hiragana' ? 'h' : 'k'
  return entries.map(([kana, romaji, row, column, idSuffix]) => ({
    id: `${prefix}-${idSuffix ?? romaji}`,
    kana,
    romaji,
    script,
    stage,
    row,
    column,
  }))
}

// ── Seion: Hiragana ───────────────────────────

const SEION_HIRAGANA: readonly KanaCharacter[] = build('seion', 'hiragana', [
  // a row
  ['あ', 'a', 'a', 'a'],
  ['い', 'i', 'a', 'i'],
  ['う', 'u', 'a', 'u'],
  ['え', 'e', 'a', 'e'],
  ['お', 'o', 'a', 'o'],
  // ka row
  ['か', 'ka', 'ka', 'a'],
  ['き', 'ki', 'ka', 'i'],
  ['く', 'ku', 'ka', 'u'],
  ['け', 'ke', 'ka', 'e'],
  ['こ', 'ko', 'ka', 'o'],
  // sa row
  ['さ', 'sa', 'sa', 'a'],
  ['し', 'shi', 'sa', 'i'],
  ['す', 'su', 'sa', 'u'],
  ['せ', 'se', 'sa', 'e'],
  ['そ', 'so', 'sa', 'o'],
  // ta row
  ['た', 'ta', 'ta', 'a'],
  ['ち', 'chi', 'ta', 'i'],
  ['つ', 'tsu', 'ta', 'u'],
  ['て', 'te', 'ta', 'e'],
  ['と', 'to', 'ta', 'o'],
  // na row
  ['な', 'na', 'na', 'a'],
  ['に', 'ni', 'na', 'i'],
  ['ぬ', 'nu', 'na', 'u'],
  ['ね', 'ne', 'na', 'e'],
  ['の', 'no', 'na', 'o'],
  // ha row
  ['は', 'ha', 'ha', 'a'],
  ['ひ', 'hi', 'ha', 'i'],
  ['ふ', 'fu', 'ha', 'u'],
  ['へ', 'he', 'ha', 'e'],
  ['ほ', 'ho', 'ha', 'o'],
  // ma row
  ['ま', 'ma', 'ma', 'a'],
  ['み', 'mi', 'ma', 'i'],
  ['む', 'mu', 'ma', 'u'],
  ['め', 'me', 'ma', 'e'],
  ['も', 'mo', 'ma', 'o'],
  // ya row (gaps at i, e)
  ['や', 'ya', 'ya', 'a'],
  ['ゆ', 'yu', 'ya', 'u'],
  ['よ', 'yo', 'ya', 'o'],
  // ra row
  ['ら', 'ra', 'ra', 'a'],
  ['り', 'ri', 'ra', 'i'],
  ['る', 'ru', 'ra', 'u'],
  ['れ', 're', 'ra', 'e'],
  ['ろ', 'ro', 'ra', 'o'],
  // wa row (gaps at i, u, e)
  ['わ', 'wa', 'wa', 'a'],
  ['を', 'wo', 'wa', 'o'],
  // n (standalone)
  ['ん', 'n', 'n', 'a'],
])

// ── Seion: Katakana ───────────────────────────

const SEION_KATAKANA: readonly KanaCharacter[] = build('seion', 'katakana', [
  ['ア', 'a', 'a', 'a'],
  ['イ', 'i', 'a', 'i'],
  ['ウ', 'u', 'a', 'u'],
  ['エ', 'e', 'a', 'e'],
  ['オ', 'o', 'a', 'o'],
  ['カ', 'ka', 'ka', 'a'],
  ['キ', 'ki', 'ka', 'i'],
  ['ク', 'ku', 'ka', 'u'],
  ['ケ', 'ke', 'ka', 'e'],
  ['コ', 'ko', 'ka', 'o'],
  ['サ', 'sa', 'sa', 'a'],
  ['シ', 'shi', 'sa', 'i'],
  ['ス', 'su', 'sa', 'u'],
  ['セ', 'se', 'sa', 'e'],
  ['ソ', 'so', 'sa', 'o'],
  ['タ', 'ta', 'ta', 'a'],
  ['チ', 'chi', 'ta', 'i'],
  ['ツ', 'tsu', 'ta', 'u'],
  ['テ', 'te', 'ta', 'e'],
  ['ト', 'to', 'ta', 'o'],
  ['ナ', 'na', 'na', 'a'],
  ['ニ', 'ni', 'na', 'i'],
  ['ヌ', 'nu', 'na', 'u'],
  ['ネ', 'ne', 'na', 'e'],
  ['ノ', 'no', 'na', 'o'],
  ['ハ', 'ha', 'ha', 'a'],
  ['ヒ', 'hi', 'ha', 'i'],
  ['フ', 'fu', 'ha', 'u'],
  ['ヘ', 'he', 'ha', 'e'],
  ['ホ', 'ho', 'ha', 'o'],
  ['マ', 'ma', 'ma', 'a'],
  ['ミ', 'mi', 'ma', 'i'],
  ['ム', 'mu', 'ma', 'u'],
  ['メ', 'me', 'ma', 'e'],
  ['モ', 'mo', 'ma', 'o'],
  ['ヤ', 'ya', 'ya', 'a'],
  ['ユ', 'yu', 'ya', 'u'],
  ['ヨ', 'yo', 'ya', 'o'],
  ['ラ', 'ra', 'ra', 'a'],
  ['リ', 'ri', 'ra', 'i'],
  ['ル', 'ru', 'ra', 'u'],
  ['レ', 're', 'ra', 'e'],
  ['ロ', 'ro', 'ra', 'o'],
  ['ワ', 'wa', 'wa', 'a'],
  ['ヲ', 'wo', 'wa', 'o'],
  ['ン', 'n', 'n', 'a'],
])

// ── Dakuon: Hiragana ──────────────────────────
// Hepburn romaji collisions get a Kunrei-style id suffix (5th tuple slot).
// ぢ → id h-di (Hepburn display: "ji"). づ → id h-du (display: "zu").

const DAKUON_HIRAGANA: readonly KanaCharacter[] = build('dakuon', 'hiragana', [
  // ga row
  ['が', 'ga', 'ga', 'a'],
  ['ぎ', 'gi', 'ga', 'i'],
  ['ぐ', 'gu', 'ga', 'u'],
  ['げ', 'ge', 'ga', 'e'],
  ['ご', 'go', 'ga', 'o'],
  // za row
  ['ざ', 'za', 'za', 'a'],
  ['じ', 'ji', 'za', 'i'],
  ['ず', 'zu', 'za', 'u'],
  ['ぜ', 'ze', 'za', 'e'],
  ['ぞ', 'zo', 'za', 'o'],
  // da row (ぢ and づ collide with じ/ず in Hepburn)
  ['だ', 'da', 'da', 'a'],
  ['ぢ', 'ji', 'da', 'i', 'di'],
  ['づ', 'zu', 'da', 'u', 'du'],
  ['で', 'de', 'da', 'e'],
  ['ど', 'do', 'da', 'o'],
  // ba row
  ['ば', 'ba', 'ba', 'a'],
  ['び', 'bi', 'ba', 'i'],
  ['ぶ', 'bu', 'ba', 'u'],
  ['べ', 'be', 'ba', 'e'],
  ['ぼ', 'bo', 'ba', 'o'],
  // pa row (handakuten)
  ['ぱ', 'pa', 'pa', 'a'],
  ['ぴ', 'pi', 'pa', 'i'],
  ['ぷ', 'pu', 'pa', 'u'],
  ['ぺ', 'pe', 'pa', 'e'],
  ['ぽ', 'po', 'pa', 'o'],
])

// ── Dakuon: Katakana ──────────────────────────

const DAKUON_KATAKANA: readonly KanaCharacter[] = build('dakuon', 'katakana', [
  ['ガ', 'ga', 'ga', 'a'],
  ['ギ', 'gi', 'ga', 'i'],
  ['グ', 'gu', 'ga', 'u'],
  ['ゲ', 'ge', 'ga', 'e'],
  ['ゴ', 'go', 'ga', 'o'],
  ['ザ', 'za', 'za', 'a'],
  ['ジ', 'ji', 'za', 'i'],
  ['ズ', 'zu', 'za', 'u'],
  ['ゼ', 'ze', 'za', 'e'],
  ['ゾ', 'zo', 'za', 'o'],
  ['ダ', 'da', 'da', 'a'],
  ['ヂ', 'ji', 'da', 'i', 'di'],
  ['ヅ', 'zu', 'da', 'u', 'du'],
  ['デ', 'de', 'da', 'e'],
  ['ド', 'do', 'da', 'o'],
  ['バ', 'ba', 'ba', 'a'],
  ['ビ', 'bi', 'ba', 'i'],
  ['ブ', 'bu', 'ba', 'u'],
  ['ベ', 'be', 'ba', 'e'],
  ['ボ', 'bo', 'ba', 'o'],
  ['パ', 'pa', 'pa', 'a'],
  ['ピ', 'pi', 'pa', 'i'],
  ['プ', 'pu', 'pa', 'u'],
  ['ペ', 'pe', 'pa', 'e'],
  ['ポ', 'po', 'pa', 'o'],
])

// ── Yoon: Hiragana ────────────────────────────
// Yoon columns use 'a' | 'u' | 'o' to represent ya, yu, yo endings.

const YOON_HIRAGANA: readonly KanaCharacter[] = build('yoon', 'hiragana', [
  // kya row
  ['きゃ', 'kya', 'kya', 'a'],
  ['きゅ', 'kyu', 'kya', 'u'],
  ['きょ', 'kyo', 'kya', 'o'],
  // sha row
  ['しゃ', 'sha', 'sha', 'a'],
  ['しゅ', 'shu', 'sha', 'u'],
  ['しょ', 'sho', 'sha', 'o'],
  // cha row
  ['ちゃ', 'cha', 'cha', 'a'],
  ['ちゅ', 'chu', 'cha', 'u'],
  ['ちょ', 'cho', 'cha', 'o'],
  // nya row
  ['にゃ', 'nya', 'nya', 'a'],
  ['にゅ', 'nyu', 'nya', 'u'],
  ['にょ', 'nyo', 'nya', 'o'],
  // hya row
  ['ひゃ', 'hya', 'hya', 'a'],
  ['ひゅ', 'hyu', 'hya', 'u'],
  ['ひょ', 'hyo', 'hya', 'o'],
  // mya row
  ['みゃ', 'mya', 'mya', 'a'],
  ['みゅ', 'myu', 'mya', 'u'],
  ['みょ', 'myo', 'mya', 'o'],
  // rya row
  ['りゃ', 'rya', 'rya', 'a'],
  ['りゅ', 'ryu', 'rya', 'u'],
  ['りょ', 'ryo', 'rya', 'o'],
  // gya row
  ['ぎゃ', 'gya', 'gya', 'a'],
  ['ぎゅ', 'gyu', 'gya', 'u'],
  ['ぎょ', 'gyo', 'gya', 'o'],
  // ja row
  ['じゃ', 'ja', 'ja', 'a'],
  ['じゅ', 'ju', 'ja', 'u'],
  ['じょ', 'jo', 'ja', 'o'],
  // bya row
  ['びゃ', 'bya', 'bya', 'a'],
  ['びゅ', 'byu', 'bya', 'u'],
  ['びょ', 'byo', 'bya', 'o'],
  // pya row
  ['ぴゃ', 'pya', 'pya', 'a'],
  ['ぴゅ', 'pyu', 'pya', 'u'],
  ['ぴょ', 'pyo', 'pya', 'o'],
])

// ── Yoon: Katakana ────────────────────────────

const YOON_KATAKANA: readonly KanaCharacter[] = build('yoon', 'katakana', [
  ['キャ', 'kya', 'kya', 'a'],
  ['キュ', 'kyu', 'kya', 'u'],
  ['キョ', 'kyo', 'kya', 'o'],
  ['シャ', 'sha', 'sha', 'a'],
  ['シュ', 'shu', 'sha', 'u'],
  ['ショ', 'sho', 'sha', 'o'],
  ['チャ', 'cha', 'cha', 'a'],
  ['チュ', 'chu', 'cha', 'u'],
  ['チョ', 'cho', 'cha', 'o'],
  ['ニャ', 'nya', 'nya', 'a'],
  ['ニュ', 'nyu', 'nya', 'u'],
  ['ニョ', 'nyo', 'nya', 'o'],
  ['ヒャ', 'hya', 'hya', 'a'],
  ['ヒュ', 'hyu', 'hya', 'u'],
  ['ヒョ', 'hyo', 'hya', 'o'],
  ['ミャ', 'mya', 'mya', 'a'],
  ['ミュ', 'myu', 'mya', 'u'],
  ['ミョ', 'myo', 'mya', 'o'],
  ['リャ', 'rya', 'rya', 'a'],
  ['リュ', 'ryu', 'rya', 'u'],
  ['リョ', 'ryo', 'rya', 'o'],
  ['ギャ', 'gya', 'gya', 'a'],
  ['ギュ', 'gyu', 'gya', 'u'],
  ['ギョ', 'gyo', 'gya', 'o'],
  ['ジャ', 'ja', 'ja', 'a'],
  ['ジュ', 'ju', 'ja', 'u'],
  ['ジョ', 'jo', 'ja', 'o'],
  ['ビャ', 'bya', 'bya', 'a'],
  ['ビュ', 'byu', 'bya', 'u'],
  ['ビョ', 'byo', 'bya', 'o'],
  ['ピャ', 'pya', 'pya', 'a'],
  ['ピュ', 'pyu', 'pya', 'u'],
  ['ピョ', 'pyo', 'pya', 'o'],
])

// ── Main export ───────────────────────────────

// The complete chart in canonical chart order: Seion H, Seion K, Dakuon H,
// Dakuon K, Yoon H, Yoon K. Consumers should index by id via getCharacterById
// rather than relying on array position.
export const KANA_CHARACTERS: readonly KanaCharacter[] = [
  ...SEION_HIRAGANA,
  ...SEION_KATAKANA,
  ...DAKUON_HIRAGANA,
  ...DAKUON_KATAKANA,
  ...YOON_HIRAGANA,
  ...YOON_KATAKANA,
]

// Index built once at module load for O(1) lookup.
const BY_ID: ReadonlyMap<string, KanaCharacter> = new Map(KANA_CHARACTERS.map((c) => [c.id, c]))

export function getCharacterById(id: string): KanaCharacter | undefined {
  return BY_ID.get(id)
}
