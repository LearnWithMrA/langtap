// ─────────────────────────────────────────────
// File: scripts/audit-word-meanings.ts
// Purpose: Audits all word bank meanings for duplicates, bracket
//          annotations, and casing issues. Outputs a markdown
//          report to scripts/output/meaning-audit.md.
//          Run with: npx tsx scripts/audit-word-meanings.ts
// Depends on: data/words/n5.ts through n1.ts
// ─────────────────────────────────────────────

import { writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

// ── Path setup ──────────────────────────────

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const OUTPUT_PATH = join(__dirname, 'output', 'meaning-audit.md')

// ── Load word banks ─────────────────────────

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { N5_WORDS } = require('../data/words/n5') as { N5_WORDS: Word[] }
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { N4_WORDS } = require('../data/words/n4') as { N4_WORDS: Word[] }
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { N3_WORDS } = require('../data/words/n3') as { N3_WORDS: Word[] }
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { N2_WORDS } = require('../data/words/n2') as { N2_WORDS: Word[] }
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { N1_WORDS } = require('../data/words/n1') as { N1_WORDS: Word[] }

type Word = {
  id: string
  kana: string
  kanji: string | null
  meaning: string
  jlptLevel: string
  characterIds: string[]
  audioFile: string | null
}

type LevelName = 'N5' | 'N4' | 'N3' | 'N2' | 'N1'

const LEVELS: { name: LevelName; words: Word[] }[] = [
  { name: 'N5', words: N5_WORDS },
  { name: 'N4', words: N4_WORDS },
  { name: 'N3', words: N3_WORDS },
  { name: 'N2', words: N2_WORDS },
  { name: 'N1', words: N1_WORDS },
]

// ── Normalisation ───────────────────────────

function normaliseMeaning(meaning: string): string {
  return meaning
    .toLowerCase()
    .trim()
    .replace(/^to /, '')
    .replace(/\s+/g, ' ')
    .replace(/[,;]+/g, ',')
    .replace(/\(.*?\)/g, '')
    .trim()
}

// ── Report A: Duplicates ────────────────────

function auditDuplicates(): string[] {
  const lines: string[] = ['## Report A: Duplicate Meanings', '']

  let totalExact = 0
  let totalNormalised = 0

  for (const { name, words } of LEVELS) {
    // Exact duplicates
    const exactGroups = new Map<string, Word[]>()
    for (const w of words) {
      const key = w.meaning
      const list = exactGroups.get(key)
      if (list) list.push(w)
      else exactGroups.set(key, [w])
    }
    const exactDupes = [...exactGroups.entries()].filter(([, v]) => v.length > 1)
    totalExact += exactDupes.length

    // Normalised duplicates (catches "to stop" / "stop" / "To Stop")
    const normGroups = new Map<string, Word[]>()
    for (const w of words) {
      const key = normaliseMeaning(w.meaning)
      const list = normGroups.get(key)
      if (list) list.push(w)
      else normGroups.set(key, [w])
    }
    const normDupes = [...normGroups.entries()].filter(([, v]) => v.length > 1)
    const normOnly = normDupes.filter(([key]) => {
      const exactKey = [...exactGroups.entries()].find(
        ([, v]) => v.length > 1 && normaliseMeaning(v[0].meaning) === key,
      )
      return (
        !exactKey || normDupes.find(([k]) => k === key)![1].length > (exactKey?.[1].length ?? 0)
      )
    })
    totalNormalised += normOnly.length

    lines.push(`### ${name} (${words.length} words)`)
    lines.push('')

    if (exactDupes.length === 0 && normOnly.length === 0) {
      lines.push('No duplicates found.')
      lines.push('')
      continue
    }

    if (exactDupes.length > 0) {
      lines.push(`**Exact duplicates: ${exactDupes.length} sets**`)
      lines.push('')
      for (const [meaning, group] of exactDupes.sort((a, b) => a[0].localeCompare(b[0]))) {
        lines.push(`- "${meaning}" (${group.length} words):`)
        for (const w of group) {
          const display = w.kanji ? `${w.kanji} (${w.kana})` : w.kana
          lines.push(`  - \`${w.id}\` ${display}`)
        }
      }
      lines.push('')
    }

    // Show normalised groups that reveal NEW duplicates not caught by exact match
    const normExtra: [string, Word[]][] = []
    for (const [normKey, normGroup] of normDupes) {
      const uniqueMeanings = new Set(normGroup.map((w) => w.meaning))
      if (uniqueMeanings.size > 1) {
        normExtra.push([normKey, normGroup])
      }
    }

    if (normExtra.length > 0) {
      lines.push(`**Near-duplicates (normalised): ${normExtra.length} sets**`)
      lines.push('')
      for (const [, group] of normExtra.sort((a, b) => a[0].localeCompare(b[0]))) {
        const meanings = [...new Set(group.map((w) => `"${w.meaning}"`))]
        lines.push(`- ${meanings.join(' / ')} (${group.length} words):`)
        for (const w of group) {
          const display = w.kanji ? `${w.kanji} (${w.kana})` : w.kana
          lines.push(`  - \`${w.id}\` ${display} = "${w.meaning}"`)
        }
      }
      lines.push('')
    }
  }

  lines.push(
    `**Summary:** ${totalExact} exact duplicate sets, ${totalNormalised} normalised sets across all levels.`,
  )
  lines.push('')
  return lines
}

// ── Report B: Bracket annotations ───────────

const DENY_BRACKETS = new Set([
  'honorable',
  'humble',
  'hum',
  'pol',
  'col',
  'sl',
  'vulg',
  'arch',
  'obs',
  'derog',
  'fem',
  'male',
  'uk',
  'abbr',
  'hon',
  'id',
  'exp',
  'conj',
  'int',
  'pn',
  'ctr',
  'suf',
  'pref',
])

function auditBrackets(): string[] {
  const lines: string[] = ['## Report B: Bracket Annotations', '']

  for (const { name, words } of LEVELS) {
    const bracketWords: { word: Word; brackets: string[] }[] = []

    for (const w of words) {
      const matches = w.meaning.match(/\([^)]+\)/g)
      if (matches && matches.length > 0) {
        bracketWords.push({ word: w, brackets: matches })
      }
    }

    if (bracketWords.length === 0) {
      lines.push(`### ${name}: No bracket annotations`)
      lines.push('')
      continue
    }

    // Categorise brackets
    const categories = new Map<string, { word: Word; fullBracket: string }[]>()
    for (const { word, brackets } of bracketWords) {
      for (const b of brackets) {
        const inner = b.slice(1, -1).toLowerCase().trim()
        const cat = DENY_BRACKETS.has(inner) ? `DENY: ${inner}` : `KEEP: ${b}`
        const list = categories.get(cat)
        if (list) list.push({ word, fullBracket: b })
        else categories.set(cat, [{ word, fullBracket: b }])
      }
    }

    const denyCount = [...categories.entries()]
      .filter(([k]) => k.startsWith('DENY:'))
      .reduce((s, [, v]) => s + v.length, 0)
    const keepCount = [...categories.entries()]
      .filter(([k]) => k.startsWith('KEEP:'))
      .reduce((s, [, v]) => s + v.length, 0)

    lines.push(
      `### ${name} (${bracketWords.length} words with brackets, ${denyCount} deny, ${keepCount} keep)`,
    )
    lines.push('')

    // Deny list items (need transformation)
    const denyEntries = [...categories.entries()]
      .filter(([k]) => k.startsWith('DENY:'))
      .sort((a, b) => b[1].length - a[1].length)

    if (denyEntries.length > 0) {
      lines.push('**Deny list (will be transformed):**')
      lines.push('')
      for (const [cat, items] of denyEntries) {
        const label = cat.replace('DENY: ', '')
        lines.push(`- \`(${label})\` - ${items.length} occurrences`)
        for (const { word } of items.slice(0, 3)) {
          const display = word.kanji ? `${word.kanji} (${word.kana})` : word.kana
          lines.push(`  - \`${word.id}\` ${display} = "${word.meaning}"`)
        }
        if (items.length > 3) {
          lines.push(`  - ... and ${items.length - 3} more`)
        }
      }
      lines.push('')
    }

    // Keep items (contextual, stay as-is but may need repositioning)
    const keepEntries = [...categories.entries()]
      .filter(([k]) => k.startsWith('KEEP:'))
      .sort((a, b) => b[1].length - a[1].length)

    if (keepEntries.length > 0) {
      // Only show inline brackets (brackets not at end of string)
      const inlineKeep = keepEntries.filter(([, items]) =>
        items.some(({ word, fullBracket }) => {
          const idx = word.meaning.indexOf(fullBracket)
          return idx >= 0 && idx + fullBracket.length < word.meaning.length - 1
        }),
      )

      if (inlineKeep.length > 0) {
        lines.push('**Inline brackets (need repositioning to right):**')
        lines.push('')
        for (const [cat, items] of inlineKeep.slice(0, 15)) {
          const bracket = cat.replace('KEEP: ', '')
          lines.push(`- \`${bracket}\` - ${items.length} occurrences`)
          for (const { word } of items.slice(0, 2)) {
            const display = word.kanji ? `${word.kanji} (${word.kana})` : word.kana
            lines.push(`  - \`${word.id}\` ${display} = "${word.meaning}"`)
          }
        }
        if (inlineKeep.length > 15) {
          lines.push(`- ... and ${inlineKeep.length - 15} more bracket types`)
        }
        lines.push('')
      }
    }

    // Numbered senses
    const numberedWords = words.filter((w) => /\(\d+\)/.test(w.meaning))
    if (numberedWords.length > 0) {
      lines.push(`**Numbered senses (need manual curation): ${numberedWords.length} words**`)
      lines.push('')
      for (const w of numberedWords.slice(0, 5)) {
        const display = w.kanji ? `${w.kanji} (${w.kana})` : w.kana
        lines.push(`- \`${w.id}\` ${display} = "${w.meaning}"`)
      }
      if (numberedWords.length > 5) {
        lines.push(`- ... and ${numberedWords.length - 5} more`)
      }
      lines.push('')
    }
  }

  return lines
}

// ── Report C: Casing ────────────────────────

function auditCasing(): string[] {
  const lines: string[] = ['## Report C: Casing Issues', '']

  lines.push('| Level | Total | Lowercase start | Uppercase start | % lowercase |')
  lines.push('|---|---|---|---|---|')

  for (const { name, words } of LEVELS) {
    const lower = words.filter(
      (w) => w.meaning.length > 0 && w.meaning[0] !== w.meaning[0].toUpperCase(),
    ).length
    const upper = words.length - lower
    const pct = ((lower / words.length) * 100).toFixed(1)
    lines.push(`| ${name} | ${words.length} | ${lower} | ${upper} | ${pct}% |`)
  }

  lines.push('')
  return lines
}

// ── Report D: Comma-separated meanings ──────

function auditCommas(): string[] {
  const lines: string[] = ['## Report D: Multi-definition Meanings (commas)', '']

  lines.push('| Level | Total | With commas | 3+ definitions | Longest |')
  lines.push('|---|---|---|---|---|')

  for (const { name, words } of LEVELS) {
    const withCommas = words.filter((w) => w.meaning.includes(','))
    const threeOrMore = withCommas.filter((w) => w.meaning.split(',').length >= 3)
    let longest = { word: words[0], count: 0 }
    for (const w of words) {
      const count = w.meaning.split(',').length
      if (count > longest.count) longest = { word: w, count }
    }
    lines.push(
      `| ${name} | ${words.length} | ${withCommas.length} | ${threeOrMore.length} | ${longest.count} parts |`,
    )
  }

  lines.push('')
  return lines
}

// ── Summary stats ───────────────────────────

function summaryStats(): string[] {
  const lines: string[] = ['## Summary', '']
  const total = LEVELS.reduce((s, l) => s + l.words.length, 0)
  lines.push(`Total words across all levels: **${total}**`)
  lines.push('')

  const allLower = LEVELS.reduce(
    (s, l) =>
      s +
      l.words.filter((w) => w.meaning.length > 0 && w.meaning[0] !== w.meaning[0].toUpperCase())
        .length,
    0,
  )
  lines.push(
    `Words starting lowercase: **${allLower}** (${((allLower / total) * 100).toFixed(1)}%)`,
  )

  const allBrackets = LEVELS.reduce(
    (s, l) => s + l.words.filter((w) => /\([^)]+\)/.test(w.meaning)).length,
    0,
  )
  lines.push(`Words with bracket annotations: **${allBrackets}**`)

  const allNumbered = LEVELS.reduce(
    (s, l) => s + l.words.filter((w) => /\(\d+\)/.test(w.meaning)).length,
    0,
  )
  lines.push(`Words with numbered senses: **${allNumbered}**`)

  lines.push('')
  return lines
}

// ── Main ────────────────────────────────────

const report = [
  '# Word Bank Meaning Audit',
  '',
  `Generated: ${new Date().toISOString().split('T')[0]}`,
  '',
  ...summaryStats(),
  '---',
  '',
  ...auditDuplicates(),
  '---',
  '',
  ...auditBrackets(),
  '---',
  '',
  ...auditCasing(),
  '---',
  '',
  ...auditCommas(),
]

writeFileSync(OUTPUT_PATH, report.join('\n'), 'utf-8')
console.log(`Audit written to ${OUTPUT_PATH}`)
console.log(`${LEVELS.reduce((s, l) => s + l.words.length, 0)} words scanned.`)
