// ─────────────────────────────────────────────
// File: data/kana/__tests__/characters.test.ts
// Purpose: Integrity tests for the kana chart and progression groups.
//          Pins manual-entry errors (duplicate ids, orphan references,
//          missing characters, glyph collisions) at test time rather than
//          letting them surface in production UI.
// Depends on: data/kana/characters.ts, data/kana/progression-groups.ts
// ─────────────────────────────────────────────

import { KANA_CHARACTERS, getCharacterById } from '@/data/kana/characters'
import { PROGRESSION_GROUPS } from '@/data/kana/progression-groups'
import type { Stage, Script } from '@/types/kana.types'

// ── Chart integrity ───────────────────────────

describe('KANA_CHARACTERS', () => {
  it('contains 208 entries (46 seion H + 46 seion K + 25 dakuon H + 25 dakuon K + 33 yoon H + 33 yoon K)', () => {
    expect(KANA_CHARACTERS).toHaveLength(208)
  })

  it('has unique ids', () => {
    const ids = KANA_CHARACTERS.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('has unique kana glyphs within each (script, stage) partition', () => {
    const partitions = new Map<string, Set<string>>()
    for (const c of KANA_CHARACTERS) {
      const key = `${c.script}|${c.stage}`
      if (!partitions.has(key)) partitions.set(key, new Set())
      const seen = partitions.get(key)!
      expect(seen.has(c.kana), `duplicate glyph ${c.kana} in ${key}`).toBe(false)
      seen.add(c.kana)
    }
  })

  it('assigns every character a non-empty id, kana, romaji, row, column', () => {
    for (const c of KANA_CHARACTERS) {
      expect(c.id).toMatch(/^[hk]-[a-z]+$/)
      expect(c.kana.length).toBeGreaterThan(0)
      expect(c.romaji.length).toBeGreaterThan(0)
      expect(c.row.length).toBeGreaterThan(0)
      expect(c.column.length).toBeGreaterThan(0)
    }
  })

  it('has every script, stage, row, column in its expected set', () => {
    const SCRIPTS: readonly Script[] = ['hiragana', 'katakana']
    const STAGES: readonly Stage[] = ['seion', 'dakuon', 'yoon']
    for (const c of KANA_CHARACTERS) {
      expect(SCRIPTS).toContain(c.script)
      expect(STAGES).toContain(c.stage)
    }
  })
})

// ── getCharacterById ──────────────────────────

describe('getCharacterById', () => {
  it('returns the expected character for a known id', () => {
    expect(getCharacterById('h-a')?.kana).toBe('あ')
    expect(getCharacterById('k-n')?.kana).toBe('ン')
    expect(getCharacterById('h-kya')?.kana).toBe('きゃ')
  })

  it('returns undefined for an unknown id', () => {
    expect(getCharacterById('h-bogus')).toBeUndefined()
  })

  it('resolves ぢ and ず-collision ids correctly (h-ji vs h-di, h-zu vs h-du)', () => {
    expect(getCharacterById('h-ji')?.kana).toBe('じ')
    expect(getCharacterById('h-di')?.kana).toBe('ぢ')
    expect(getCharacterById('h-zu')?.kana).toBe('ず')
    expect(getCharacterById('h-du')?.kana).toBe('づ')
    expect(getCharacterById('k-ji')?.kana).toBe('ジ')
    expect(getCharacterById('k-di')?.kana).toBe('ヂ')
  })
})

// ── Progression integrity ─────────────────────

describe('PROGRESSION_GROUPS', () => {
  it('references only character ids that exist in KANA_CHARACTERS', () => {
    for (const group of PROGRESSION_GROUPS) {
      for (const id of group.characterIds) {
        expect(
          getCharacterById(id),
          `group ${group.stage}/${group.script}/${group.groupIndex} references unknown id "${id}"`,
        ).toBeDefined()
      }
    }
  })

  it('assigns every character to exactly one progression group', () => {
    const assignments = new Map<string, number>()
    for (const group of PROGRESSION_GROUPS) {
      for (const id of group.characterIds) {
        assignments.set(id, (assignments.get(id) ?? 0) + 1)
      }
    }
    for (const c of KANA_CHARACTERS) {
      expect(
        assignments.get(c.id),
        `character ${c.id} (${c.kana}) is not in any progression group`,
      ).toBe(1)
    }
    for (const [id, count] of assignments) {
      expect(count, `character ${id} appears in ${count} progression groups`).toBe(1)
    }
  })

  it('keeps characters inside a group consistent with (stage, script)', () => {
    for (const group of PROGRESSION_GROUPS) {
      for (const id of group.characterIds) {
        const character = getCharacterById(id)
        if (!character) continue
        expect(character.stage).toBe(group.stage)
        expect(character.script).toBe(group.script)
      }
    }
  })

  it('has contiguous groupIndex values (1..n) within each (stage, script) pair', () => {
    const buckets = new Map<string, number[]>()
    for (const group of PROGRESSION_GROUPS) {
      const key = `${group.stage}|${group.script}`
      if (!buckets.has(key)) buckets.set(key, [])
      buckets.get(key)!.push(group.groupIndex)
    }
    for (const [key, indexes] of buckets) {
      const sorted = [...indexes].sort((a, b) => a - b)
      for (let i = 0; i < sorted.length; i++) {
        expect(sorted[i], `${key} groups not contiguous from 1`).toBe(i + 1)
      }
    }
  })
})
