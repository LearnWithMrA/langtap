// ─────────────────────────────────────────────
// File: data/kana/progression-groups.ts
// Purpose: Guided-progression unlock groups per GAME_DESIGN.md §4.3.
//          Hiragana and katakana interleaved within each stage. A group
//          becomes active when every character in the preceding group is
//          unlocked. Within a group, all characters become eligible at once.
//          IDs reference characters defined in data/kana/characters.ts.
// Depends on: types/kana.types.ts
// ─────────────────────────────────────────────

import type { ProgressionGroup } from '@/types/kana.types'

// ── Seion groups ──────────────────────────────

const SEION_GROUPS: readonly ProgressionGroup[] = [
  // Group 1: first 10 hiragana, then first 10 katakana
  {
    stage: 'seion',
    script: 'hiragana',
    groupIndex: 1,
    characterIds: ['h-a', 'h-i', 'h-u', 'h-e', 'h-o', 'h-ka', 'h-ki', 'h-ku', 'h-ke', 'h-ko'],
  },
  {
    stage: 'seion',
    script: 'katakana',
    groupIndex: 1,
    characterIds: ['k-a', 'k-i', 'k-u', 'k-e', 'k-o', 'k-ka', 'k-ki', 'k-ku', 'k-ke', 'k-ko'],
  },
  // Group 2: sa/ta rows
  {
    stage: 'seion',
    script: 'hiragana',
    groupIndex: 2,
    characterIds: [
      'h-sa',
      'h-shi',
      'h-su',
      'h-se',
      'h-so',
      'h-ta',
      'h-chi',
      'h-tsu',
      'h-te',
      'h-to',
    ],
  },
  {
    stage: 'seion',
    script: 'katakana',
    groupIndex: 2,
    characterIds: [
      'k-sa',
      'k-shi',
      'k-su',
      'k-se',
      'k-so',
      'k-ta',
      'k-chi',
      'k-tsu',
      'k-te',
      'k-to',
    ],
  },
  // Group 3: na/ha rows
  {
    stage: 'seion',
    script: 'hiragana',
    groupIndex: 3,
    characterIds: ['h-na', 'h-ni', 'h-nu', 'h-ne', 'h-no', 'h-ha', 'h-hi', 'h-fu', 'h-he', 'h-ho'],
  },
  {
    stage: 'seion',
    script: 'katakana',
    groupIndex: 3,
    characterIds: ['k-na', 'k-ni', 'k-nu', 'k-ne', 'k-no', 'k-ha', 'k-hi', 'k-fu', 'k-he', 'k-ho'],
  },
  // Group 4: ma row, ya row, first two of ra row
  {
    stage: 'seion',
    script: 'hiragana',
    groupIndex: 4,
    characterIds: ['h-ma', 'h-mi', 'h-mu', 'h-me', 'h-mo', 'h-ya', 'h-yu', 'h-yo', 'h-ra', 'h-ri'],
  },
  {
    stage: 'seion',
    script: 'katakana',
    groupIndex: 4,
    characterIds: ['k-ma', 'k-mi', 'k-mu', 'k-me', 'k-mo', 'k-ya', 'k-yu', 'k-yo', 'k-ra', 'k-ri'],
  },
  // Group 5: rest of ra row, wa row, n
  {
    stage: 'seion',
    script: 'hiragana',
    groupIndex: 5,
    characterIds: ['h-ru', 'h-re', 'h-ro', 'h-wa', 'h-wo', 'h-n'],
  },
  {
    stage: 'seion',
    script: 'katakana',
    groupIndex: 5,
    characterIds: ['k-ru', 'k-re', 'k-ro', 'k-wa', 'k-wo', 'k-n'],
  },
]

// ── Dakuon groups ─────────────────────────────

const DAKUON_GROUPS: readonly ProgressionGroup[] = [
  // Group 1: ga + za rows
  {
    stage: 'dakuon',
    script: 'hiragana',
    groupIndex: 1,
    characterIds: ['h-ga', 'h-gi', 'h-gu', 'h-ge', 'h-go', 'h-za', 'h-ji', 'h-zu', 'h-ze', 'h-zo'],
  },
  {
    stage: 'dakuon',
    script: 'katakana',
    groupIndex: 1,
    characterIds: ['k-ga', 'k-gi', 'k-gu', 'k-ge', 'k-go', 'k-za', 'k-ji', 'k-zu', 'k-ze', 'k-zo'],
  },
  // Group 2: da + ba rows (note: ぢ = h-di, づ = h-du)
  {
    stage: 'dakuon',
    script: 'hiragana',
    groupIndex: 2,
    characterIds: ['h-da', 'h-di', 'h-du', 'h-de', 'h-do', 'h-ba', 'h-bi', 'h-bu', 'h-be', 'h-bo'],
  },
  {
    stage: 'dakuon',
    script: 'katakana',
    groupIndex: 2,
    characterIds: ['k-da', 'k-di', 'k-du', 'k-de', 'k-do', 'k-ba', 'k-bi', 'k-bu', 'k-be', 'k-bo'],
  },
  // Group 3: pa row (handakuten)
  {
    stage: 'dakuon',
    script: 'hiragana',
    groupIndex: 3,
    characterIds: ['h-pa', 'h-pi', 'h-pu', 'h-pe', 'h-po'],
  },
  {
    stage: 'dakuon',
    script: 'katakana',
    groupIndex: 3,
    characterIds: ['k-pa', 'k-pi', 'k-pu', 'k-pe', 'k-po'],
  },
]

// ── Yoon groups ───────────────────────────────

const YOON_GROUPS: readonly ProgressionGroup[] = [
  // Group 1: kya, sha, cha rows, first of nya
  {
    stage: 'yoon',
    script: 'hiragana',
    groupIndex: 1,
    characterIds: [
      'h-kya',
      'h-kyu',
      'h-kyo',
      'h-sha',
      'h-shu',
      'h-sho',
      'h-cha',
      'h-chu',
      'h-cho',
      'h-nya',
    ],
  },
  {
    stage: 'yoon',
    script: 'katakana',
    groupIndex: 1,
    characterIds: [
      'k-kya',
      'k-kyu',
      'k-kyo',
      'k-sha',
      'k-shu',
      'k-sho',
      'k-cha',
      'k-chu',
      'k-cho',
      'k-nya',
    ],
  },
  // Group 2: rest of nya, hya, mya, start of rya
  {
    stage: 'yoon',
    script: 'hiragana',
    groupIndex: 2,
    characterIds: [
      'h-nyu',
      'h-nyo',
      'h-hya',
      'h-hyu',
      'h-hyo',
      'h-mya',
      'h-myu',
      'h-myo',
      'h-rya',
      'h-ryu',
    ],
  },
  {
    stage: 'yoon',
    script: 'katakana',
    groupIndex: 2,
    characterIds: [
      'k-nyu',
      'k-nyo',
      'k-hya',
      'k-hyu',
      'k-hyo',
      'k-mya',
      'k-myu',
      'k-myo',
      'k-rya',
      'k-ryu',
    ],
  },
  // Group 3: ryo, gya, ja, bya
  {
    stage: 'yoon',
    script: 'hiragana',
    groupIndex: 3,
    characterIds: [
      'h-ryo',
      'h-gya',
      'h-gyu',
      'h-gyo',
      'h-ja',
      'h-ju',
      'h-jo',
      'h-bya',
      'h-byu',
      'h-byo',
    ],
  },
  {
    stage: 'yoon',
    script: 'katakana',
    groupIndex: 3,
    characterIds: [
      'k-ryo',
      'k-gya',
      'k-gyu',
      'k-gyo',
      'k-ja',
      'k-ju',
      'k-jo',
      'k-bya',
      'k-byu',
      'k-byo',
    ],
  },
  // Group 4: pya row
  {
    stage: 'yoon',
    script: 'hiragana',
    groupIndex: 4,
    characterIds: ['h-pya', 'h-pyu', 'h-pyo'],
  },
  {
    stage: 'yoon',
    script: 'katakana',
    groupIndex: 4,
    characterIds: ['k-pya', 'k-pyu', 'k-pyo'],
  },
]

// ── Main export ───────────────────────────────

export const PROGRESSION_GROUPS: readonly ProgressionGroup[] = [
  ...SEION_GROUPS,
  ...DAKUON_GROUPS,
  ...YOON_GROUPS,
]
