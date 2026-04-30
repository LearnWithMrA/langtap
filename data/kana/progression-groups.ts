// ─────────────────────────────────────────────
// File: data/kana/progression-groups.ts
// Purpose: Guided-progression unlock groups per GAME_DESIGN.md §4.3.
//          Hiragana leads by two groups, then katakana follows by two.
//          First unlock is always H1+H2 (paired for word variety),
//          second is K1+K2, then individual groups from there.
//          IDs reference characters defined in data/kana/characters.ts.
// Depends on: types/kana.types.ts
// ─────────────────────────────────────────────

import type { ProgressionGroup } from '@/types/kana.types'

// ── Seion: hiragana ──────────────────────────

const H_SEION_1: ProgressionGroup = {
  stage: 'seion',
  script: 'hiragana',
  groupIndex: 1,
  characterIds: ['h-a', 'h-i', 'h-u', 'h-e', 'h-o', 'h-ka', 'h-ki', 'h-ku', 'h-ke', 'h-ko'],
}

const H_SEION_2: ProgressionGroup = {
  stage: 'seion',
  script: 'hiragana',
  groupIndex: 2,
  characterIds: ['h-sa', 'h-shi', 'h-su', 'h-se', 'h-so'],
}

const H_SEION_3: ProgressionGroup = {
  stage: 'seion',
  script: 'hiragana',
  groupIndex: 3,
  characterIds: ['h-ta', 'h-chi', 'h-tsu', 'h-te', 'h-to'],
}

const H_SEION_4: ProgressionGroup = {
  stage: 'seion',
  script: 'hiragana',
  groupIndex: 4,
  characterIds: ['h-na', 'h-ni', 'h-nu', 'h-ne', 'h-no'],
}

const H_SEION_5: ProgressionGroup = {
  stage: 'seion',
  script: 'hiragana',
  groupIndex: 5,
  characterIds: ['h-ha', 'h-hi', 'h-fu', 'h-he', 'h-ho'],
}

const H_SEION_6: ProgressionGroup = {
  stage: 'seion',
  script: 'hiragana',
  groupIndex: 6,
  characterIds: ['h-ma', 'h-mi', 'h-mu', 'h-me', 'h-mo'],
}

const H_SEION_7: ProgressionGroup = {
  stage: 'seion',
  script: 'hiragana',
  groupIndex: 7,
  characterIds: ['h-ya', 'h-yu', 'h-yo', 'h-ra', 'h-ri'],
}

const H_SEION_8: ProgressionGroup = {
  stage: 'seion',
  script: 'hiragana',
  groupIndex: 8,
  characterIds: ['h-ru', 'h-re', 'h-ro', 'h-wa', 'h-wo'],
}

const H_SEION_9: ProgressionGroup = {
  stage: 'seion',
  script: 'hiragana',
  groupIndex: 9,
  characterIds: ['h-n'],
}

// ── Seion: katakana ──────────────────────────
// Sokuon and longvowel in group 1 because nearly all katakana loanwords need them.

const K_SEION_1: ProgressionGroup = {
  stage: 'seion',
  script: 'katakana',
  groupIndex: 1,
  characterIds: ['k-a', 'k-i', 'k-u', 'k-e', 'k-o', 'k-ka', 'k-ki', 'k-ku', 'k-ke', 'k-ko'],
}

const K_SEION_2: ProgressionGroup = {
  stage: 'seion',
  script: 'katakana',
  groupIndex: 2,
  characterIds: ['k-sa', 'k-shi', 'k-su', 'k-se', 'k-so'],
}

const K_SEION_3: ProgressionGroup = {
  stage: 'seion',
  script: 'katakana',
  groupIndex: 3,
  characterIds: ['k-ta', 'k-chi', 'k-tsu', 'k-te', 'k-to'],
}

const K_SEION_4: ProgressionGroup = {
  stage: 'seion',
  script: 'katakana',
  groupIndex: 4,
  characterIds: ['k-na', 'k-ni', 'k-nu', 'k-ne', 'k-no'],
}

const K_SEION_5: ProgressionGroup = {
  stage: 'seion',
  script: 'katakana',
  groupIndex: 5,
  characterIds: ['k-ha', 'k-hi', 'k-fu', 'k-he', 'k-ho'],
}

const K_SEION_6: ProgressionGroup = {
  stage: 'seion',
  script: 'katakana',
  groupIndex: 6,
  characterIds: ['k-ma', 'k-mi', 'k-mu', 'k-me', 'k-mo'],
}

const K_SEION_7: ProgressionGroup = {
  stage: 'seion',
  script: 'katakana',
  groupIndex: 7,
  characterIds: ['k-ya', 'k-yu', 'k-yo', 'k-ra', 'k-ri'],
}

const K_SEION_8: ProgressionGroup = {
  stage: 'seion',
  script: 'katakana',
  groupIndex: 8,
  characterIds: ['k-ru', 'k-re', 'k-ro', 'k-wa', 'k-wo'],
}

const K_SEION_9: ProgressionGroup = {
  stage: 'seion',
  script: 'katakana',
  groupIndex: 9,
  characterIds: ['k-n'],
}

// ── Dakuon: hiragana ─────────────────────────

const H_DAKUON_1: ProgressionGroup = {
  stage: 'dakuon',
  script: 'hiragana',
  groupIndex: 1,
  characterIds: ['h-ga', 'h-gi', 'h-gu', 'h-ge', 'h-go', 'h-za', 'h-ji', 'h-zu', 'h-ze', 'h-zo'],
}

const H_DAKUON_2: ProgressionGroup = {
  stage: 'dakuon',
  script: 'hiragana',
  groupIndex: 2,
  characterIds: ['h-da', 'h-di', 'h-du', 'h-de', 'h-do', 'h-ba', 'h-bi', 'h-bu', 'h-be', 'h-bo'],
}

const H_DAKUON_3: ProgressionGroup = {
  stage: 'dakuon',
  script: 'hiragana',
  groupIndex: 3,
  characterIds: ['h-pa', 'h-pi', 'h-pu', 'h-pe', 'h-po'],
}

// ── Dakuon: katakana ─────────────────────────

const K_DAKUON_1: ProgressionGroup = {
  stage: 'dakuon',
  script: 'katakana',
  groupIndex: 1,
  characterIds: ['k-ga', 'k-gi', 'k-gu', 'k-ge', 'k-go', 'k-za', 'k-ji', 'k-zu', 'k-ze', 'k-zo'],
}

const K_DAKUON_2: ProgressionGroup = {
  stage: 'dakuon',
  script: 'katakana',
  groupIndex: 2,
  characterIds: ['k-da', 'k-di', 'k-du', 'k-de', 'k-do', 'k-ba', 'k-bi', 'k-bu', 'k-be', 'k-bo'],
}

const K_DAKUON_3: ProgressionGroup = {
  stage: 'dakuon',
  script: 'katakana',
  groupIndex: 3,
  characterIds: ['k-pa', 'k-pi', 'k-pu', 'k-pe', 'k-po'],
}

const K_DAKUON_4: ProgressionGroup = {
  stage: 'dakuon',
  script: 'katakana',
  groupIndex: 4,
  characterIds: ['k-va', 'k-vi', 'k-vu', 'k-ve', 'k-vo'],
}

// ── Combination: hiragana ────────────────────

const H_COMBO_1: ProgressionGroup = {
  stage: 'combination',
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
}

const H_COMBO_2: ProgressionGroup = {
  stage: 'combination',
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
}

const H_COMBO_3: ProgressionGroup = {
  stage: 'combination',
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
}

const H_COMBO_4: ProgressionGroup = {
  stage: 'combination',
  script: 'hiragana',
  groupIndex: 4,
  characterIds: ['h-pya', 'h-pyu', 'h-pyo'],
}

// ── Combination: katakana ────────────────────

const K_COMBO_1: ProgressionGroup = {
  stage: 'combination',
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
}

const K_COMBO_2: ProgressionGroup = {
  stage: 'combination',
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
}

const K_COMBO_3: ProgressionGroup = {
  stage: 'combination',
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
}

const K_COMBO_4: ProgressionGroup = {
  stage: 'combination',
  script: 'katakana',
  groupIndex: 4,
  characterIds: ['k-pya', 'k-pyu', 'k-pyo'],
}

// ── Extended katakana combinations ───────��───

const K_EXTENDED_1: ProgressionGroup = {
  stage: 'combination',
  script: 'katakana',
  groupIndex: 5,
  characterIds: ['k-fa', 'k-fi', 'k-fe', 'k-fo', 'k-wi', 'k-we', 'k-uxo'],
}

const K_EXTENDED_2: ProgressionGroup = {
  stage: 'combination',
  script: 'katakana',
  groupIndex: 6,
  characterIds: ['k-tsa', 'k-tsi', 'k-tse', 'k-tso', 'k-ti', 'k-twu', 'k-dhi', 'k-dwu'],
}

const K_EXTENDED_3: ProgressionGroup = {
  stage: 'combination',
  script: 'katakana',
  groupIndex: 7,
  characterIds: ['k-she', 'k-che', 'k-je'],
}

// ── Main export ──────────────────────────────
// First 10 hiragana auto-unlock, then first 10 katakana, then 5 by 5
// alternating H, K through the remaining seion, dakuon, and combination
// stages. Auto-progression only unlocks H_SEION_1 (index 0).

export const PROGRESSION_GROUPS: readonly ProgressionGroup[] = [
  // Seion: H1(10), K1(10), then 5-by-5 alternating
  H_SEION_1, // 0: a-row + ka-row (10 chars, auto-unlock)
  K_SEION_1, // 1: a-row + ka-row (10 chars)
  H_SEION_2, // 2: sa-row (5)
  K_SEION_2, // 3: sa-row (5)
  H_SEION_3, // 4: ta-row (5)
  K_SEION_3, // 5: ta-row (5)
  H_SEION_4, // 6: na-row (5)
  K_SEION_4, // 7: na-row (5)
  H_SEION_5, // 8: ha-row (5)
  K_SEION_5, // 9: ha-row (5)
  H_SEION_6, // 10: ma-row (5)
  K_SEION_6, // 11: ma-row (5)
  H_SEION_7, // 12: ya-row + ra-row start (5)
  K_SEION_7, // 13: ya-row + ra-row start (5)
  H_SEION_8, // 14: ra-row end + wa-row (5)
  K_SEION_8, // 15: ra-row end + wa-row (5)
  H_SEION_9, // 16: n + sokuon (2)
  K_SEION_9, // 17: n + sokuon + longvowel (3)
  // Dakuon
  H_DAKUON_1, // 18
  K_DAKUON_1, // 19
  H_DAKUON_2, // 20
  K_DAKUON_2, // 21
  H_DAKUON_3, // 22
  K_DAKUON_3, // 23
  K_DAKUON_4, // 24: vu-row
  // Combination
  H_COMBO_1, // 25
  K_COMBO_1, // 26
  H_COMBO_2, // 27
  K_COMBO_2, // 28
  H_COMBO_3, // 29
  K_COMBO_3, // 30
  H_COMBO_4, // 31
  K_COMBO_4, // 32
  K_EXTENDED_1, // 33
  K_EXTENDED_2, // 34
  K_EXTENDED_3, // 35
]

// ── Unlock step map ─────────────────────────
// Step 0 is the auto-unlock (first 10 hiragana).
// Step 1 is the first 10 katakana.
// All subsequent steps are single 5-character groups.

export const UNLOCK_STEPS: readonly (readonly number[])[] = [
  [0], // Step 0: H-seion-1 (10 chars, auto-unlock)
  [1], // Step 1: K-seion-1 (10 chars)
  [2], // Step 2: H sa-row
  [3], // Step 3: K sa-row
  [4], // Step 4: H ta-row
  [5], // Step 5: K ta-row
  [6], // Step 6: H na-row
  [7], // Step 7: K na-row
  [8], // Step 8: H ha-row
  [9], // Step 9: K ha-row
  [10], // Step 10: H ma-row
  [11], // Step 11: K ma-row
  [12], // Step 12: H ya+ra start
  [13], // Step 13: K ya+ra start
  [14], // Step 14: H ra end+wa
  [15], // Step 15: K ra end+wa
  [16], // Step 16: H n+sokuon
  [17], // Step 17: K n+sokuon+longvowel
  [18], // Step 18: H-dakuon-1
  [19], // Step 19: K-dakuon-1
  [20], // Step 20: H-dakuon-2
  [21], // Step 21: K-dakuon-2
  [22], // Step 22: H-dakuon-3
  [23], // Step 23: K-dakuon-3
  [24], // Step 24: K-dakuon-4 (vu)
  [25], // Step 25: H-combo-1
  [26], // Step 26: K-combo-1
  [27], // Step 27: H-combo-2
  [28], // Step 28: K-combo-2
  [29], // Step 29: H-combo-3
  [30], // Step 30: K-combo-3
  [31], // Step 31: H-combo-4
  [32], // Step 32: K-combo-4
  [33], // Step 33: K-extended-1
  [34], // Step 34: K-extended-2
  [35], // Step 35: K-extended-3
]
