// ─────────────────────────────────────────────
// File: data/tutorial/trial-prompts.ts
// Purpose: Fixed trial prompts for the tutorial trial round.
//          5 single-character prompts (あ い う え お) followed by
//          3 word prompts using only those characters.
//          Tap grid distractors drawn from groups 0+1 (a-row + ka-row).
// Depends on: types/word.types.ts
// ─────────────────────────────────────────────

import type { WordBankEntry } from '@/types/word.types'
import type { PracticePrompt } from '@/hooks/usePracticeSession'

// ── Trial tap grid characters (groups 0+1) ────

export const TRIAL_ALLOWED_IDS: string[] = [
  'h-a',
  'h-i',
  'h-u',
  'h-e',
  'h-o',
  'h-ka',
  'h-ki',
  'h-ku',
  'h-ke',
  'h-ko',
]

// ── Prompt builders ───────────────────────────

function charPrompt(charId: string, kana: string, romaji: string): PracticePrompt {
  const word: WordBankEntry = {
    id: `trial-${charId}`,
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

// ── Exports ───────────────────────────────────

export const TRIAL_PROMPTS: PracticePrompt[] = [
  charPrompt('h-a', 'あ', 'a'),
  charPrompt('h-i', 'い', 'i'),
  charPrompt('h-u', 'う', 'u'),
  wordPrompt('1198180', 'あう', '会う', 'To meet', [
    { id: 'h-a', kana: 'あ', romaji: 'a' },
    { id: 'h-u', kana: 'う', romaji: 'u' },
  ]),
  wordPrompt('1191730', 'いえ', '家', 'House', [
    { id: 'h-i', kana: 'い', romaji: 'i' },
    { id: 'h-e', kana: 'え', romaji: 'e' },
  ]),
  wordPrompt('1352130', 'うえ', '上', 'On top of', [
    { id: 'h-u', kana: 'う', romaji: 'u' },
    { id: 'h-e', kana: 'え', romaji: 'e' },
  ]),
]
