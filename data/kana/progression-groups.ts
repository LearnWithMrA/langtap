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
  characterIds: ['h-a', 'h-i', 'h-u', 'h-e', 'h-o', 'h-ka', 'h-ki', 'h-ku', 'h-ke', 'h-ko', 'h-sokuon'],
}

const H_SEION_2: ProgressionGroup = {
  stage: 'seion',
  script: 'hiragana',
  groupIndex: 2,
  characterIds: ['h-sa', 'h-shi', 'h-su', 'h-se', 'h-so', 'h-ta', 'h-chi', 'h-tsu', 'h-te', 'h-to'],
}

const H_SEION_3: ProgressionGroup = {
  stage: 'seion',
  script: 'hiragana',
  groupIndex: 3,
  characterIds: ['h-na', 'h-ni', 'h-nu', 'h-ne', 'h-no', 'h-ha', 'h-hi', 'h-fu', 'h-he', 'h-ho'],
}

const H_SEION_4: ProgressionGroup = {
  stage: 'seion',
  script: 'hiragana',
  groupIndex: 4,
  characterIds: ['h-ma', 'h-mi', 'h-mu', 'h-me', 'h-mo', 'h-ya', 'h-yu', 'h-yo', 'h-ra', 'h-ri'],
}

const H_SEION_5: ProgressionGroup = {
  stage: 'seion',
  script: 'hiragana',
  groupIndex: 5,
  characterIds: ['h-ru', 'h-re', 'h-ro', 'h-wa', 'h-wo', 'h-n'],
}

// ── Seion: katakana ──────────────────────────
// Sokuon and longvowel in group 1 because nearly all katakana loanwords need them.

const K_SEION_1: ProgressionGroup = {
  stage: 'seion',
  script: 'katakana',
  groupIndex: 1,
  characterIds: ['k-a', 'k-i', 'k-u', 'k-e', 'k-o', 'k-ka', 'k-ki', 'k-ku', 'k-ke', 'k-ko', 'k-sokuon', 'k-longvowel'],
}

const K_SEION_2: ProgressionGroup = {
  stage: 'seion',
  script: 'katakana',
  groupIndex: 2,
  characterIds: ['k-sa', 'k-shi', 'k-su', 'k-se', 'k-so', 'k-ta', 'k-chi', 'k-tsu', 'k-te', 'k-to'],
}

const K_SEION_3: ProgressionGroup = {
  stage: 'seion',
  script: 'katakana',
  groupIndex: 3,
  characterIds: ['k-na', 'k-ni', 'k-nu', 'k-ne', 'k-no', 'k-ha', 'k-hi', 'k-fu', 'k-he', 'k-ho'],
}

const K_SEION_4: ProgressionGroup = {
  stage: 'seion',
  script: 'katakana',
  groupIndex: 4,
  characterIds: ['k-ma', 'k-mi', 'k-mu', 'k-me', 'k-mo', 'k-ya', 'k-yu', 'k-yo', 'k-ra', 'k-ri'],
}

const K_SEION_5: ProgressionGroup = {
  stage: 'seion',
  script: 'katakana',
  groupIndex: 5,
  characterIds: ['k-ru', 'k-re', 'k-ro', 'k-wa', 'k-wo', 'k-n'],
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
  characterIds: ['h-kya', 'h-kyu', 'h-kyo', 'h-sha', 'h-shu', 'h-sho', 'h-cha', 'h-chu', 'h-cho', 'h-nya'],
}

const H_COMBO_2: ProgressionGroup = {
  stage: 'combination',
  script: 'hiragana',
  groupIndex: 2,
  characterIds: ['h-nyu', 'h-nyo', 'h-hya', 'h-hyu', 'h-hyo', 'h-mya', 'h-myu', 'h-myo', 'h-rya', 'h-ryu'],
}

const H_COMBO_3: ProgressionGroup = {
  stage: 'combination',
  script: 'hiragana',
  groupIndex: 3,
  characterIds: ['h-ryo', 'h-gya', 'h-gyu', 'h-gyo', 'h-ja', 'h-ju', 'h-jo', 'h-bya', 'h-byu', 'h-byo'],
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
  characterIds: ['k-kya', 'k-kyu', 'k-kyo', 'k-sha', 'k-shu', 'k-sho', 'k-cha', 'k-chu', 'k-cho', 'k-nya'],
}

const K_COMBO_2: ProgressionGroup = {
  stage: 'combination',
  script: 'katakana',
  groupIndex: 2,
  characterIds: ['k-nyu', 'k-nyo', 'k-hya', 'k-hyu', 'k-hyo', 'k-mya', 'k-myu', 'k-myo', 'k-rya', 'k-ryu'],
}

const K_COMBO_3: ProgressionGroup = {
  stage: 'combination',
  script: 'katakana',
  groupIndex: 3,
  characterIds: ['k-ryo', 'k-gya', 'k-gyu', 'k-gyo', 'k-ja', 'k-ju', 'k-jo', 'k-bya', 'k-byu', 'k-byo'],
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
// Hiragana leads by two groups, then katakana follows by two.
// Within each stage, pattern is: H, H, K, K, H, H, K, K...
// The auto-progression engine pairs the first two groups for initial
// unlock (H1+H2 together, then K1+K2 together) to ensure enough
// word variety from the start.

export const PROGRESSION_GROUPS: readonly ProgressionGroup[] = [
  // Seion: H1, H2, K1, K2, H3, H4, K3, K4, H5, K5
  H_SEION_1, H_SEION_2, K_SEION_1, K_SEION_2,
  H_SEION_3, H_SEION_4, K_SEION_3, K_SEION_4,
  H_SEION_5, K_SEION_5,
  // Dakuon: H1, H2, K1, K2, H3, K3, K4(vu)
  H_DAKUON_1, H_DAKUON_2, K_DAKUON_1, K_DAKUON_2,
  H_DAKUON_3, K_DAKUON_3, K_DAKUON_4,
  // Combination: H1, H2, K1, K2, H3, H4, K3, K4, extended K5-K7
  H_COMBO_1, H_COMBO_2, K_COMBO_1, K_COMBO_2,
  H_COMBO_3, H_COMBO_4, K_COMBO_3, K_COMBO_4,
  K_EXTENDED_1, K_EXTENDED_2, K_EXTENDED_3,
]

// ── Unlock step map ─────────────────────────
// Defines which groups unlock together at each step.
// Steps 0 and 1 are paired (2 groups each) to guarantee enough
// words for a meaningful first practice session (minimum 10 chars).
// All subsequent steps are single groups.

export const UNLOCK_STEPS: readonly (readonly number[])[] = [
  [0, 1],   // Step 0: H-seion-1 + H-seion-2 (21 chars)
  [2, 3],   // Step 1: K-seion-1 + K-seion-2 (22 chars)
  [4],      // Step 2: H-seion-3
  [5],      // Step 3: H-seion-4
  [6],      // Step 4: K-seion-3
  [7],      // Step 5: K-seion-4
  [8],      // Step 6: H-seion-5
  [9],      // Step 7: K-seion-5
  [10],     // Step 8: H-dakuon-1
  [11],     // Step 9: H-dakuon-2
  [12],     // Step 10: K-dakuon-1
  [13],     // Step 11: K-dakuon-2
  [14],     // Step 12: H-dakuon-3
  [15],     // Step 13: K-dakuon-3
  [16],     // Step 14: K-dakuon-4 (vu)
  [17],     // Step 15: H-combo-1
  [18],     // Step 16: H-combo-2
  [19],     // Step 17: K-combo-1
  [20],     // Step 18: K-combo-2
  [21],     // Step 19: H-combo-3
  [22],     // Step 20: H-combo-4
  [23],     // Step 21: K-combo-3
  [24],     // Step 22: K-combo-4
  [25],     // Step 23: K-extended-1
  [26],     // Step 24: K-extended-2
  [27],     // Step 25: K-extended-3
]
