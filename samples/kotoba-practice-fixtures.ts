// ─────────────────────────────────────────────
// File: samples/kotoba-practice-fixtures.ts
// Purpose: Mock Kotoba word data for the practice visual shell.
//          15 entries mixing kanji words and kana-only words.
//          Used until real word banks are generated in Sprint 5.
// Depends on: none (self-contained mock data)
// ─────────────────────────────────────────────

// ── Types ─────────────────────────────────────

export type MockKotobaWord = {
  readonly id: string
  readonly kanji: string | null
  readonly kana: string
  readonly english: string
  readonly jlpt: 'n5' | 'n4' | 'n3'
  readonly isKanaOnly: boolean
  readonly acceptedAnswers: readonly string[]
  readonly characters: readonly { readonly kana: string; readonly romaji: string }[]
  readonly similarKanji: readonly string[]
}

// ── Data ──────────────────────────────────────

const KOTOBA_WORDS: readonly MockKotobaWord[] = [
  {
    id: 'k-inu',
    kanji: '犬',
    kana: 'いぬ',
    english: 'dog',
    jlpt: 'n5',
    isKanaOnly: false,
    acceptedAnswers: ['犬'],
    characters: [
      { kana: 'い', romaji: 'i' },
      { kana: 'ぬ', romaji: 'nu' },
    ],
    similarKanji: ['太', '大', '犯'],
  },
  {
    id: 'k-koohii',
    kanji: null,
    kana: 'コーヒー',
    english: 'coffee',
    jlpt: 'n5',
    isKanaOnly: true,
    acceptedAnswers: ['コーヒー'],
    characters: [
      { kana: 'コ', romaji: 'ko' },
      { kana: 'ー', romaji: '-' },
      { kana: 'ヒ', romaji: 'hi' },
      { kana: 'ー', romaji: '-' },
    ],
    similarKanji: [],
  },
  {
    id: 'k-neko',
    kanji: '猫',
    kana: 'ねこ',
    english: 'cat',
    jlpt: 'n4',
    isKanaOnly: false,
    acceptedAnswers: ['猫'],
    characters: [
      { kana: 'ね', romaji: 'ne' },
      { kana: 'こ', romaji: 'ko' },
    ],
    similarKanji: ['描', '猿', '狸'],
  },
  {
    id: 'k-ohayou',
    kanji: null,
    kana: 'おはよう',
    english: 'good morning',
    jlpt: 'n5',
    isKanaOnly: true,
    acceptedAnswers: ['おはよう'],
    characters: [
      { kana: 'お', romaji: 'o' },
      { kana: 'は', romaji: 'ha' },
      { kana: 'よ', romaji: 'yo' },
      { kana: 'う', romaji: 'u' },
    ],
    similarKanji: [],
  },
  {
    id: 'k-hon',
    kanji: '本',
    kana: 'ほん',
    english: 'book',
    jlpt: 'n5',
    isKanaOnly: false,
    acceptedAnswers: ['本'],
    characters: [
      { kana: 'ほ', romaji: 'ho' },
      { kana: 'ん', romaji: 'n' },
    ],
    similarKanji: ['木', '体', '末'],
  },
  {
    id: 'k-mizu',
    kanji: '水',
    kana: 'みず',
    english: 'water',
    jlpt: 'n5',
    isKanaOnly: false,
    acceptedAnswers: ['水'],
    characters: [
      { kana: 'み', romaji: 'mi' },
      { kana: 'ず', romaji: 'zu' },
    ],
    similarKanji: ['氷', '永', '泉'],
  },
  {
    id: 'k-yama',
    kanji: '山',
    kana: 'やま',
    english: 'mountain',
    jlpt: 'n5',
    isKanaOnly: false,
    acceptedAnswers: ['山'],
    characters: [
      { kana: 'や', romaji: 'ya' },
      { kana: 'ま', romaji: 'ma' },
    ],
    similarKanji: ['出', '岩', '川'],
  },
  {
    id: 'k-hi',
    kanji: '火',
    kana: 'ひ',
    english: 'fire',
    jlpt: 'n5',
    isKanaOnly: false,
    acceptedAnswers: ['火'],
    characters: [{ kana: 'ひ', romaji: 'hi' }],
    similarKanji: ['灰', '炎', '水'],
  },
  {
    id: 'k-taberu',
    kanji: '食べる',
    kana: 'たべる',
    english: 'to eat',
    jlpt: 'n5',
    isKanaOnly: false,
    acceptedAnswers: ['食べる'],
    characters: [
      { kana: 'た', romaji: 'ta' },
      { kana: 'べ', romaji: 'be' },
      { kana: 'る', romaji: 'ru' },
    ],
    similarKanji: ['飲む', '飯', '食う'],
  },
  {
    id: 'k-nomu',
    kanji: '飲む',
    kana: 'のむ',
    english: 'to drink',
    jlpt: 'n5',
    isKanaOnly: false,
    acceptedAnswers: ['飲む'],
    characters: [
      { kana: 'の', romaji: 'no' },
      { kana: 'む', romaji: 'mu' },
    ],
    similarKanji: ['食べる', '飯', '酒'],
  },
  {
    id: 'k-ookii',
    kanji: '大きい',
    kana: 'おおきい',
    english: 'big',
    jlpt: 'n5',
    isKanaOnly: false,
    acceptedAnswers: ['大きい'],
    characters: [
      { kana: 'お', romaji: 'o' },
      { kana: 'お', romaji: 'o' },
      { kana: 'き', romaji: 'ki' },
      { kana: 'い', romaji: 'i' },
    ],
    similarKanji: ['太い', '犬', '小さい'],
  },
  {
    id: 'k-atarashii',
    kanji: '新しい',
    kana: 'あたらしい',
    english: 'new',
    jlpt: 'n5',
    isKanaOnly: false,
    acceptedAnswers: ['新しい'],
    characters: [
      { kana: 'あ', romaji: 'a' },
      { kana: 'た', romaji: 'ta' },
      { kana: 'ら', romaji: 'ra' },
      { kana: 'し', romaji: 'shi' },
      { kana: 'い', romaji: 'i' },
    ],
    similarKanji: ['古い', '親しい', '近い'],
  },
  {
    id: 'k-hana',
    kanji: '花',
    kana: 'はな',
    english: 'flower',
    jlpt: 'n4',
    isKanaOnly: false,
    acceptedAnswers: ['花'],
    characters: [
      { kana: 'は', romaji: 'ha' },
      { kana: 'な', romaji: 'na' },
    ],
    similarKanji: ['華', '草', '葉'],
  },
  {
    id: 'k-tomodachi',
    kanji: '友達',
    kana: 'ともだち',
    english: 'friend',
    jlpt: 'n5',
    isKanaOnly: false,
    acceptedAnswers: ['友達'],
    characters: [
      { kana: 'と', romaji: 'to' },
      { kana: 'も', romaji: 'mo' },
      { kana: 'だ', romaji: 'da' },
      { kana: 'ち', romaji: 'chi' },
    ],
    similarKanji: ['友人', '仲間', '先達'],
  },
  {
    id: 'k-terebi',
    kanji: null,
    kana: 'テレビ',
    english: 'television',
    jlpt: 'n5',
    isKanaOnly: true,
    acceptedAnswers: ['テレビ'],
    characters: [
      { kana: 'テ', romaji: 'te' },
      { kana: 'レ', romaji: 're' },
      { kana: 'ビ', romaji: 'bi' },
    ],
    similarKanji: [],
  },
  {
    id: 'k-amerika',
    kanji: null,
    kana: 'アメリカ',
    english: 'America',
    jlpt: 'n5',
    isKanaOnly: true,
    acceptedAnswers: ['アメリカ'],
    characters: [
      { kana: 'ア', romaji: 'a' },
      { kana: 'メ', romaji: 'me' },
      { kana: 'リ', romaji: 'ri' },
      { kana: 'カ', romaji: 'ka' },
    ],
    similarKanji: [],
  },
]

// ── Accessors ─────────────────────────────────

export function getMockKotobaWords(): readonly MockKotobaWord[] {
  return KOTOBA_WORDS
}

export function generateKanjiDistractors(correctKanji: string, count: number): string[] {
  const word = KOTOBA_WORDS.find((w) => w.kanji === correctKanji)
  const similar = word?.similarKanji ?? []
  const shuffledSimilar = [...similar].sort(() => Math.random() - 0.5)

  if (shuffledSimilar.length >= count) return shuffledSimilar.slice(0, count)

  const fallbackPool = KOTOBA_WORDS.filter(
    (w) => w.kanji !== null && w.kanji !== correctKanji && !similar.includes(w.kanji as string),
  )
    .map((w) => w.kanji as string)
    .sort(() => Math.random() - 0.5)

  return [...shuffledSimilar, ...fallbackPool].slice(0, count)
}
