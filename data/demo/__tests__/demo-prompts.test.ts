// ─────────────────────────────────────────────
// File: data/demo/__tests__/demo-prompts.test.ts
// Purpose: Integrity tests for demo prompt data. Ensures counts
//          match, structures are valid, and allowed IDs cover all
//          demo character IDs.
// Depends on: data/demo/demo-prompts.ts
// ─────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import {
  DEMO_KANA_PROMPTS,
  DEMO_KOTOBA_PROMPTS,
  DEMO_KANA_PROMPT_COUNT,
  DEMO_KOTOBA_PROMPT_COUNT,
  DEMO_ALLOWED_IDS,
} from '../demo-prompts'

describe('demo prompts integrity', () => {
  it('DEMO_KANA_PROMPT_COUNT matches array length', () => {
    expect(DEMO_KANA_PROMPT_COUNT).toBe(DEMO_KANA_PROMPTS.length)
  })

  it('DEMO_KOTOBA_PROMPT_COUNT matches array length', () => {
    expect(DEMO_KOTOBA_PROMPT_COUNT).toBe(DEMO_KOTOBA_PROMPTS.length)
  })

  it('all kana prompts have valid structure', () => {
    for (const prompt of DEMO_KANA_PROMPTS) {
      expect(prompt.kind).toBeDefined()
      expect(prompt.characters.length).toBeGreaterThan(0)
      expect(prompt.word).toBeDefined()
      expect(prompt.word.id).toBeTruthy()
      expect(prompt.word.kana).toBeTruthy()
    }
  })

  it('all kotoba prompts have valid structure', () => {
    for (const prompt of DEMO_KOTOBA_PROMPTS) {
      expect(prompt.kana).toBeTruthy()
      expect(prompt.english).toBeTruthy()
      expect(prompt.characters.length).toBeGreaterThan(0)
      expect(prompt.id).toBeTruthy()
    }
  })

  it('DEMO_ALLOWED_IDS covers all kana character IDs', () => {
    const allowedSet = new Set(DEMO_ALLOWED_IDS)
    const allCharIds = DEMO_KANA_PROMPTS.flatMap((p) => p.characters.map((c) => c.id))
    for (const id of allCharIds) {
      expect(allowedSet.has(id)).toBe(true)
    }
  })

  it('has at least 10 kana prompts and 5 kotoba prompts', () => {
    expect(DEMO_KANA_PROMPTS.length).toBeGreaterThanOrEqual(10)
    expect(DEMO_KOTOBA_PROMPTS.length).toBeGreaterThanOrEqual(5)
  })
})
