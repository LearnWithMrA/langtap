// ------------------------------------------------------------
// File: scripts/build-word-bank.ts
// Purpose: Generates data/words/n5.ts through n1.ts from JMDict JSON
//          source files. Run once with `npx tsx scripts/build-word-bank.ts`.
//          Commit the output files. Do not run during a coding session
//          without owner approval.
// Depends on: data/kana/characters.ts, scripts/source/jmdict/*.json
// ------------------------------------------------------------

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

// ── Path setup ───────────────────────────────

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = join(__dirname, '..')
const SOURCE_DIR = join(__dirname, 'source', 'jmdict')
const OUTPUT_DIR = join(ROOT, 'data', 'words')

// ── Types ────────────────────────────────────

type JmDictEntry = {
  jmdict_seq: string
  kana: string
  kanji: string
  waller_definition: string
}

type JlptLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1'

type OutputEntry = {
  id: string
  kana: string
  kanji: string | null
  meaning: string
  jlptLevel: JlptLevel
  characterIds: string[]
  audioFile: string | null
}

type RejectionStats = {
  emptyKana: number
  emptyMeaning: number
  tooShort: number
  unmappedChar: number
  duplicate: number
  total: number
}

// ── Load kana character dataset ──────────────

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { KANA_CHARACTERS } = require('../data/kana/characters') as {
  KANA_CHARACTERS: ReadonlyArray<{
    id: string
    kana: string
    romaji: string
    script: string
    stage: string
    row: string
    column: string
  }>
}

// Build kana-to-id lookup. Longer strings first for yoon matching.
const kanaToId = new Map<string, string>()
const sortedChars = [...KANA_CHARACTERS].sort((a, b) => b.kana.length - a.kana.length)
for (const char of sortedChars) {
  kanaToId.set(char.kana, char.id)
}

// ── Kana decomposition ───────────────────────

function decomposeKana(kana: string): string[] | null {
  const normalized = kana.normalize('NFC')
  const ids: string[] = []
  let i = 0

  while (i < normalized.length) {
    if (i + 1 < normalized.length) {
      const twoChar = normalized.slice(i, i + 2)
      const twoId = kanaToId.get(twoChar)
      if (twoId) {
        ids.push(twoId)
        i += 2
        continue
      }
    }

    const oneChar = normalized[i]
    const oneId = kanaToId.get(oneChar)
    if (oneId) {
      ids.push(oneId)
      i += 1
    } else {
      return null
    }
  }

  return ids
}

// ── Filtering ────────────────────────────────

function isKatakanaOnly(kana: string): boolean {
  return /^[゠-ヿー]+$/.test(kana.normalize('NFC'))
}

// ── Main pipeline ────────────────────────────

const LEVELS: JlptLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1']
const seenKana = new Set<string>()
const seenIds = new Set<string>()
const allResults: Record<JlptLevel, OutputEntry[]> = {
  N5: [],
  N4: [],
  N3: [],
  N2: [],
  N1: [],
}

const stats: Record<
  JlptLevel,
  { total: number; accepted: number; rejected: RejectionStats; katakanaOnly: number }
> = {
  N5: {
    total: 0,
    accepted: 0,
    rejected: {
      emptyKana: 0,
      emptyMeaning: 0,
      tooShort: 0,
      unmappedChar: 0,
      duplicate: 0,
      total: 0,
    },
    katakanaOnly: 0,
  },
  N4: {
    total: 0,
    accepted: 0,
    rejected: {
      emptyKana: 0,
      emptyMeaning: 0,
      tooShort: 0,
      unmappedChar: 0,
      duplicate: 0,
      total: 0,
    },
    katakanaOnly: 0,
  },
  N3: {
    total: 0,
    accepted: 0,
    rejected: {
      emptyKana: 0,
      emptyMeaning: 0,
      tooShort: 0,
      unmappedChar: 0,
      duplicate: 0,
      total: 0,
    },
    katakanaOnly: 0,
  },
  N2: {
    total: 0,
    accepted: 0,
    rejected: {
      emptyKana: 0,
      emptyMeaning: 0,
      tooShort: 0,
      unmappedChar: 0,
      duplicate: 0,
      total: 0,
    },
    katakanaOnly: 0,
  },
  N1: {
    total: 0,
    accepted: 0,
    rejected: {
      emptyKana: 0,
      emptyMeaning: 0,
      tooShort: 0,
      unmappedChar: 0,
      duplicate: 0,
      total: 0,
    },
    katakanaOnly: 0,
  },
}

for (const level of LEVELS) {
  const filePath = join(SOURCE_DIR, `${level.toLowerCase()}.json`)
  const raw = readFileSync(filePath, 'utf-8')
  const entries: JmDictEntry[] = JSON.parse(raw)
  const levelStats = stats[level]
  levelStats.total = entries.length

  for (const entry of entries) {
    const kana = entry.kana.normalize('NFC').trim()
    const meaning = entry.waller_definition.trim()

    if (!kana) {
      levelStats.rejected.emptyKana++
      levelStats.rejected.total++
      continue
    }

    if (!meaning) {
      levelStats.rejected.emptyMeaning++
      levelStats.rejected.total++
      continue
    }

    const charIds = decomposeKana(kana)
    if (!charIds) {
      levelStats.rejected.unmappedChar++
      levelStats.rejected.total++
      continue
    }

    if (charIds.length < 2) {
      levelStats.rejected.tooShort++
      levelStats.rejected.total++
      continue
    }

    if (seenKana.has(kana)) {
      levelStats.rejected.duplicate++
      levelStats.rejected.total++
      continue
    }

    seenKana.add(kana)

    const baseId = entry.jmdict_seq
    const id = seenIds.has(baseId) ? `${baseId}-${kana}` : baseId
    seenIds.add(baseId)

    const kanji = entry.kanji.trim() || null

    if (isKatakanaOnly(kana)) {
      levelStats.katakanaOnly++
    }

    const outputEntry: OutputEntry = {
      id,
      kana,
      kanji,
      meaning,
      jlptLevel: level,
      characterIds: charIds,
      audioFile: null,
    }

    allResults[level].push(outputEntry)
    levelStats.accepted++
  }
}

// ── Write output files ───────────────────────

mkdirSync(OUTPUT_DIR, { recursive: true })

for (const level of LEVELS) {
  const entries = allResults[level]
  const varName = `${level}_WORDS`
  const lines = entries.map((e) => {
    const charIds = e.characterIds.map((cid) => `'${cid}'`).join(', ')
    const kanji = e.kanji ? `'${e.kanji.replace(/'/g, "\\'")}'` : 'null'
    const meaning = e.meaning.replace(/'/g, "\\'")
    return `  { id: '${e.id}', kana: '${e.kana}', kanji: ${kanji}, meaning: '${meaning}', jlptLevel: '${e.jlptLevel}', characterIds: [${charIds}], audioFile: null },`
  })

  const content = [
    `// Generated by scripts/build-word-bank.ts. Do not edit manually.`,
    ``,
    `import type { WordBankEntry } from '@/types/word.types'`,
    ``,
    `export const ${varName}: WordBankEntry[] = [`,
    ...lines,
    `]`,
    ``,
  ].join('\n')

  writeFileSync(join(OUTPUT_DIR, `${level.toLowerCase()}.ts`), content)
}

const indexContent = [
  `// Generated by scripts/build-word-bank.ts. Do not edit manually.`,
  ``,
  `import { N5_WORDS } from './n5'`,
  `import { N4_WORDS } from './n4'`,
  `import { N3_WORDS } from './n3'`,
  `import { N2_WORDS } from './n2'`,
  `import { N1_WORDS } from './n1'`,
  `import type { JlptLevel } from '@/types/user.types'`,
  `import type { WordBankEntry } from '@/types/word.types'`,
  ``,
  `// Level-scoped loading. Use WORD_BANK[level] in route components.`,
  `// ALL_WORDS is for tests and tooling only. Do not import in routes.`,
  `export const WORD_BANK: Record<JlptLevel, WordBankEntry[]> = {`,
  `  N5: N5_WORDS,`,
  `  N4: N4_WORDS,`,
  `  N3: N3_WORDS,`,
  `  N2: N2_WORDS,`,
  `  N1: N1_WORDS,`,
  `}`,
  ``,
  `export const ALL_WORDS: WordBankEntry[] = [`,
  `  ...N5_WORDS,`,
  `  ...N4_WORDS,`,
  `  ...N3_WORDS,`,
  `  ...N2_WORDS,`,
  `  ...N1_WORDS,`,
  `]`,
  ``,
].join('\n')

writeFileSync(join(OUTPUT_DIR, 'index.ts'), indexContent)

// ── Console output ───────────────────────────

console.log('\n=== Word Bank Build Results ===\n')

let grandTotal = 0
let grandAccepted = 0

for (const level of LEVELS) {
  const s = stats[level]
  grandTotal += s.total
  grandAccepted += s.accepted
  console.log(`${level}: ${s.accepted}/${s.total} accepted (${s.katakanaOnly} katakana-only)`)
  if (s.rejected.total > 0) {
    const r = s.rejected
    const parts: string[] = []
    if (r.emptyKana) parts.push(`emptyKana=${r.emptyKana}`)
    if (r.emptyMeaning) parts.push(`emptyMeaning=${r.emptyMeaning}`)
    if (r.tooShort) parts.push(`tooShort=${r.tooShort}`)
    if (r.unmappedChar) parts.push(`unmappedChar=${r.unmappedChar}`)
    if (r.duplicate) parts.push(`duplicate=${r.duplicate}`)
    console.log(`  rejected: ${r.total} (${parts.join(', ')})`)
  }
}

console.log(`\nTotal: ${grandAccepted}/${grandTotal} words across all levels`)
console.log(`Output written to data/words/\n`)
