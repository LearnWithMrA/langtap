// ─────────────────────────────────────────────
// File: data/__tests__/catalog-completeness.test.ts
// Purpose: Verifies that the SQL catalog seed migrations contain
//          every ID from the TypeScript source data. Catches
//          content drift between source data and seeded SQL.
// Depends on: data/kana/characters.ts, data/words/, supabase/migrations/
// ─────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { KANA_CHARACTERS } from '../kana/characters'
import { N5_WORDS } from '../words/n5'
import { N4_WORDS } from '../words/n4'
import { N3_WORDS } from '../words/n3'
import { N2_WORDS } from '../words/n2'
import { N1_WORDS } from '../words/n1'
import { KATAKANA_WORDS } from '../words/kt'

// ── Helpers ───────────────────────────────────

function extractIdsFromSqlSection(
  sqlPath: string,
  sectionMarker: string,
  idPattern: RegExp,
): Set<string> {
  const sql = readFileSync(resolve(process.cwd(), sqlPath), 'utf8')
  const sectionStart = sql.indexOf(sectionMarker)
  const section = sectionStart >= 0 ? sql.slice(sectionStart) : sql
  const ids = new Set<string>()
  let match: RegExpExecArray | null
  while ((match = idPattern.exec(section)) !== null) {
    ids.add(match[1])
  }
  return ids
}

// ── Kana character catalog ────────────────────

describe('kana character catalog completeness', () => {
  const kanaCatalogPath = 'supabase/migrations/20260507120001_create_and_seed_kana_catalog.sql'

  const seededCharIds = extractIdsFromSqlSection(
    kanaCatalogPath,
    'insert into public.kana_character_catalog',
    /\('([^']+)',\s*'[^']*',\s*'[^']*',\s*'(?:hiragana|katakana)'\)/g,
  )

  it('contains every character from data/kana/characters.ts', () => {
    const sourceIds = KANA_CHARACTERS.map((c) => c.id)
    const missing = sourceIds.filter((id) => !seededCharIds.has(id))
    expect(missing).toEqual([])
  })

  it('has the same count as source data', () => {
    expect(seededCharIds.size).toBe(KANA_CHARACTERS.length)
  })

  it('has no duplicates in source data', () => {
    const ids = KANA_CHARACTERS.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

// ── Word catalog completeness ─────────────────

describe('word catalog completeness', () => {
  const wordCatalogPath = 'supabase/migrations/20260507120001_create_and_seed_kana_catalog.sql'

  const seededWordIds = extractIdsFromSqlSection(
    wordCatalogPath,
    'insert into public.leaderboard_word_catalog',
    /\('([^']+)',\s*\d+,\s*(?:true|false),/g,
  )

  const allWords = [
    ...N5_WORDS,
    ...N4_WORDS,
    ...N3_WORDS,
    ...N2_WORDS,
    ...N1_WORDS,
    ...KATAKANA_WORDS,
  ]

  const sourceWordIds = allWords.map((w) => w.id).filter((id) => id.length > 0)

  it('contains every non-empty word ID from all word banks', () => {
    const missing = sourceWordIds.filter((id) => !seededWordIds.has(id))
    expect(missing).toEqual([])
  })

  it('includes katakana words', () => {
    const ktIds = KATAKANA_WORDS.map((w) => w.id)
    const missing = ktIds.filter((id) => !seededWordIds.has(id))
    expect(missing).toEqual([])
  })

  it('has the expected total count', () => {
    expect(seededWordIds.size).toBe(sourceWordIds.length)
  })

  it('documents the one known empty ID in N1', () => {
    const emptyIds = allWords.filter((w) => w.id.length === 0)
    expect(emptyIds).toHaveLength(1)
    expect(emptyIds[0].kana).toBe('い')
    expect(emptyIds[0].kanji).toBe('依')
  })
})
