// ─────────────────────────────────────────────
// File: data/demo/demo-mastery.ts
// Purpose: Pre-built mastery fixtures for the demo taster experience.
//          Simulates a "mature account" with varied heatmap colours,
//          partial unlock progression, and mixed mastery levels.
//          Used by demo kana dojo and demo kotoba dojo views.
// Depends on: types/game.types.ts
// ─────────────────────────────────────────────

import type { MasteryScoreMap } from '@/types/game.types'

// ── Kana mastery scores ──────────────────────
// Hiragana seion: all groups unlocked, varied scores across heat bands.
// Katakana seion: groups 1-3 unlocked, lower scores (newer area).
// Hiragana dakuon: group 1 partially practiced.
// Everything else locked (shows locked tiles in the dojo).

export const DEMO_KANA_MASTERY_SCORES: Readonly<MasteryScoreMap> = {
  // Hiragana Seion Group 1 (a-row + ka-row): well-practiced
  'h-a': 52,
  'h-i': 44,
  'h-u': 38,
  'h-e': 27,
  'h-o': 45,
  'h-ka': 41,
  'h-ki': 33,
  'h-ku': 22,
  'h-ke': 15,
  'h-ko': 48,

  // Hiragana Seion Group 2 (sa-row): moderate progress
  'h-sa': 19,
  'h-shi': 25,
  'h-su': 8,
  'h-se': 12,
  'h-so': 6,

  // Hiragana Seion Group 3 (ta-row): moderate progress
  'h-ta': 14,
  'h-chi': 21,
  'h-tsu': 7,
  'h-te': 18,
  'h-to': 11,

  // Hiragana Seion Group 4 (na-row): recent unlock, lower scores
  'h-na': 9,
  'h-ni': 4,
  'h-nu': 2,
  'h-ne': 7,
  'h-no': 3,

  // Hiragana Seion Group 5 (ha-row): recent unlock
  'h-ha': 6,
  'h-hi': 3,
  'h-fu': 1,
  'h-he': 5,
  'h-ho': 8,

  // Hiragana Seion Group 6 (ma-row): freshly unlocked
  'h-ma': 3,
  'h-mi': 1,
  'h-mu': 0,
  'h-me': 2,
  'h-mo': 0,

  // Hiragana Seion Group 7 (ya-row + ra partial): freshly unlocked
  'h-ya': 2,
  'h-yu': 0,
  'h-yo': 1,
  'h-ra': 0,
  'h-ri': 0,

  // Hiragana Seion Group 8 (ra cont + wa-row): freshly unlocked
  'h-ru': 0,
  'h-re': 0,
  'h-ro': 0,
  'h-wa': 0,
  'h-wo': 0,

  // Hiragana Seion Group 9 (n): freshly unlocked
  'h-n': 1,

  // Katakana Seion Group 1 (a-row + ka-row): moderate
  'k-a': 16,
  'k-i': 11,
  'k-u': 8,
  'k-e': 5,
  'k-o': 13,
  'k-ka': 10,
  'k-ki': 7,
  'k-ku': 4,
  'k-ke': 2,
  'k-ko': 9,

  // Katakana Seion Group 2 (sa-row): early
  'k-sa': 3,
  'k-shi': 1,
  'k-su': 2,
  'k-se': 0,
  'k-so': 1,

  // Katakana Seion Group 3 (ta-row): very early
  'k-ta': 1,
  'k-chi': 0,
  'k-tsu': 0,
  'k-te': 2,
  'k-to': 0,

  // Hiragana Dakuon Group 1 (ga + za rows): just started
  'h-ga': 3,
  'h-gi': 1,
  'h-gu': 0,
  'h-ge': 0,
  'h-go': 2,
  'h-za': 1,
  'h-ji': 0,
  'h-zu': 0,
  'h-ze': 0,
  'h-zo': 0,
}

// ── Kana learning scores ─────────────────────
// All unlocked characters have learning score 5 (word-eligible threshold).
// Characters not listed here are still in the learning phase or locked.

export const DEMO_KANA_LEARNING_SCORES: Readonly<MasteryScoreMap> = Object.fromEntries(
  Object.keys(DEMO_KANA_MASTERY_SCORES).map((id) => [id, 5]),
)

// ── Kana manual unlock IDs ───────────────────
// All characters with demo mastery scores are considered manually unlocked.

export const DEMO_KANA_MANUAL_UNLOCK_IDS: readonly string[] = Object.keys(
  DEMO_KANA_MASTERY_SCORES,
)

// ── Kotoba (word) mastery scores ─────────────
// First 3 N5 levels (36 words) with varied mastery. Level 4 partially
// started. Gives the dojo a mix of mastered, mid-progress, and fresh tiles.
// Word IDs are real JMDict sequence numbers from data/words/kotoba-levels/n5.ts.

export const DEMO_WORD_MASTERY_SCORES: Readonly<MasteryScoreMap> = {
  // N5 Level 1 (12 words): mostly mastered
  '1184270': 18,
  '1583250': 16,
  '1311110': 20,
  '1605820': 15,
  '1531710': 17,
  '2842390': 12,
  '1189130': 19,
  '1223615': 14,
  '1010080': 16,
  '1009000': 21,
  '1001140': 15,
  '2820690': 10,

  // N5 Level 2 (12 words): moderate progress
  '1581930': 9,
  '1249960': 11,
  '1001830': 7,
  '1001990': 13,
  '1002330': 5,
  '1524590': 8,
  '1002650': 6,
  '1307630': 10,
  '1249900': 4,
  '1002320': 3,
  '1179330': 7,
  '1002590': 2,

  // N5 Level 3 (12 words): early progress
  '1419990': 3,
  '1602710': 2,
  '1540170': 4,
  '1420010': 1,
  '1203650': 2,
  '1344930': 0,
  '2261490': 1,
  '1414170': 0,
  '2261500': 3,
  '1307850': 1,
  '1192150': 0,
  '1344970': 0,

  // N5 Level 4 (partial): just started
  '2839962': 1,
  '1318610': 0,
  '1002120': 0,
}

// ── Kotoba manual unlock IDs ─────────────────
// Words in the first 3 levels + partial level 4 are unlocked.

export const DEMO_WORD_MANUAL_UNLOCK_IDS: readonly string[] = Object.keys(
  DEMO_WORD_MASTERY_SCORES,
)
