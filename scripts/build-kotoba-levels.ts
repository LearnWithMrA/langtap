// ─────────────────────────────────────────────
// File: scripts/build-kotoba-levels.ts
// Purpose: Reads a categories markdown file, extracts word IDs in order,
//          splits into levels of 12, and writes the TypeScript level file.
//          Run: npx tsx scripts/build-kotoba-levels.ts <level>
//          Example: npx tsx scripts/build-kotoba-levels.ts n5
// ─────────────────────────────────────────────

import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = join(__dirname, '..')

// ── Constants ─────────────────────────────────

const WORDS_PER_LEVEL = 12

// ── Main ──────────────────────────────────────

function build(level: string): void {
  const categoriesPath = join(ROOT, 'data', 'words', 'kotoba-levels', 'categories', `${level}.md`)
  const outputPath = join(ROOT, 'data', 'words', 'kotoba-levels', `${level}.ts`)
  const bankPath = join(ROOT, 'data', 'words', `${level}.ts`)

  const content = readFileSync(categoriesPath, 'utf8')
  const bankContent = readFileSync(bankPath, 'utf8')

  const ids: string[] = []
  const idRegex = /\[([^\]]+)\]/g
  let match
  while ((match = idRegex.exec(content)) !== null) {
    ids.push(match[1])
  }

  const bankIds = new Set<string>()
  const bankIdRegex = /id:\s*'([^']+)'/g
  while ((match = bankIdRegex.exec(bankContent)) !== null) {
    bankIds.add(match[1])
  }

  const invalid = ids.filter((id) => !bankIds.has(id))
  if (invalid.length > 0) {
    console.error(`\n❌ ${invalid.length} invalid IDs found:`)
    for (const id of invalid.slice(0, 10)) {
      console.error(`  ${id}`)
    }
    process.exit(1)
  }

  const seen = new Set<string>()
  const duplicates: string[] = []
  for (const id of ids) {
    if (seen.has(id)) {
      duplicates.push(id)
    }
    seen.add(id)
  }
  if (duplicates.length > 0) {
    console.error(`\n❌ ${duplicates.length} duplicate IDs found:`)
    for (const id of duplicates.slice(0, 10)) {
      console.error(`  ${id}`)
    }
    process.exit(1)
  }

  const missing = [...bankIds].filter((id) => !seen.has(id))
  if (missing.length > 0) {
    console.error(`\n❌ ${missing.length} words in bank but not in categories:`)
    for (const id of missing.slice(0, 10)) {
      console.error(`  ${id}`)
    }
    process.exit(1)
  }

  const meaningMap = new Map<string, string>()
  const meaningRegex =
    /id:\s*'([^']+)',\s*kana:\s*'[^']*',\s*kanji:\s*[^,]+,\s*meaning:\s*'([^']*)'/g
  while ((match = meaningRegex.exec(bankContent)) !== null) {
    meaningMap.set(match[1], match[2])
  }

  const levels: string[][] = []
  for (let i = 0; i < ids.length; i += WORDS_PER_LEVEL) {
    levels.push(ids.slice(i, i + WORDS_PER_LEVEL))
  }

  const lines: string[] = []
  lines.push('// ─────────────────────────────────────────────')
  lines.push(`// File: data/words/kotoba-levels/${level}.ts`)
  lines.push(
    `// Purpose: ${level.toUpperCase()} Kotoba level definitions. ${levels.length} levels.`,
  )
  lines.push('//          Built from categories file by scripts/build-kotoba-levels.ts.')
  lines.push('//          See docs/CONTENT.md Section 11 for design principles.')
  lines.push('// Depends on: data/words/kotoba-levels/types.ts')
  lines.push('// ─────────────────────────────────────────────')
  lines.push('')
  lines.push("import type { KotobaLevel } from './types'")
  lines.push('')
  lines.push(`export const ${level.toUpperCase()}_LEVELS: readonly KotobaLevel[] = [`)

  for (const levelIds of levels) {
    const meanings = levelIds.map((id) => meaningMap.get(id) || '?').join(', ')
    const idsFormatted = levelIds.map((id) => `'${id}'`).join(', ')
    lines.push(`  // ${meanings}`)
    lines.push(`  { wordIds: [${idsFormatted}] },`)
  }

  lines.push(']')
  lines.push('')

  writeFileSync(outputPath, lines.join('\n'))

  console.log(`\n✅ ${level.toUpperCase()}: ${levels.length} levels, ${ids.length} words`)
  console.log(`   Output: ${outputPath}`)
  if (levels.length > 0 && levels[levels.length - 1].length < WORDS_PER_LEVEL) {
    console.log(
      `   Last level has ${levels[levels.length - 1].length} words (less than ${WORDS_PER_LEVEL})`,
    )
  }
}

// ── CLI ───────────────────────────────────────

const level = process.argv[2]

if (!level) {
  console.log('Usage: npx tsx scripts/build-kotoba-levels.ts <level>')
  console.log('Example: npx tsx scripts/build-kotoba-levels.ts n5')
  process.exit(1)
}

build(level)
