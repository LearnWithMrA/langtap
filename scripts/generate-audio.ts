// ─────────────────────────────────────────────
// File: scripts/generate-audio.ts
// Purpose: Calls the local VOICEVOX API for every word in the word
//          bank, generates MP3 files, and builds the word-manifest.
//          Incremental: re-running only generates missing files.
//          Run with: npx tsx scripts/generate-audio.ts [--level N5]
//                    [--dry-run] [--speaker 2]
// Depends on: data/words/n5..n1, VOICEVOX running at localhost:50021,
//             ffmpeg installed
// ─────────────────────────────────────────────

import { existsSync, mkdirSync, writeFileSync, unlinkSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'
import { tmpdir } from 'node:os'

// ── Path setup ───────────────────────────────

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = join(__dirname, '..')
const OUTPUT_DIR = join(ROOT, 'public', 'audio', 'words')
const MANIFEST_PATH = join(ROOT, 'data', 'audio', 'word-manifest.ts')

// ── Constants ────────────────────────────────

const VOICEVOX_BASE = 'http://localhost:50021'
const BATCH_SIZE = 5
const BATCH_DELAY_MS = 100
const DEFAULT_SPEAKER = 2

// ── Voice tuning (Shikoku Metan Normal) ─────

const VOICE_OVERRIDES = {
  speedScale: 0.85,
  prePhonemeLength: 0.05,
  postPhonemeLength: 0.05,
  outputSamplingRate: 44100,
}

// ── Types ────────────────────────────────────

type WordEntry = {
  id: string
  kana: string
  level: string
}

type Stats = {
  generated: number
  skipped: number
  errors: number
}

// ── CLI arg parsing ────────────────────��─────

function parseArgs(): { level: string | null; dryRun: boolean; speaker: number } {
  const args = process.argv.slice(2)
  let level: string | null = null
  let dryRun = false
  let speaker = DEFAULT_SPEAKER

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--level' && args[i + 1]) {
      level = args[i + 1].toUpperCase()
      i++
    } else if (args[i] === '--dry-run') {
      dryRun = true
    } else if (args[i] === '--speaker' && args[i + 1]) {
      speaker = parseInt(args[i + 1], 10)
      i++
    }
  }

  return { level, dryRun, speaker }
}

// ── Prerequisite checks ─────────────────────

async function checkVoicevox(): Promise<void> {
  try {
    const res = await fetch(`${VOICEVOX_BASE}/version`)
    if (!res.ok) throw new Error(`Status ${res.status}`)
    const version = await res.text()
    console.log(`VOICEVOX version: ${version}`)
  } catch {
    console.error('VOICEVOX is not running at http://localhost:50021')
    console.error('Start it before running this script.')
    process.exit(1)
  }
}

function checkFfmpeg(): void {
  try {
    execSync('ffmpeg -version', { stdio: 'pipe' })
  } catch {
    console.error('ffmpeg not found. Install with: brew install ffmpeg')
    process.exit(1)
  }
}

// ── Word loading ─────────────────────────────

function isValidId(id: string): boolean {
  if (id.length === 0) return false
  if (/[/\\"\s$`]/.test(id)) return false
  return true
}

function tagLevel(words: Array<{ id: string; kana: string }>, level: string): WordEntry[] {
  return words
    .filter((w) => isValidId(w.id) && w.kana.length > 0)
    .map((w) => ({ id: w.id, kana: w.kana, level }))
}

async function loadWords(levelFilter: string | null): Promise<WordEntry[]> {
  const { N5_WORDS } = await import('../data/words/n5')
  const { N4_WORDS } = await import('../data/words/n4')
  const { N3_WORDS } = await import('../data/words/n3')
  const { N2_WORDS } = await import('../data/words/n2')
  const { N1_WORDS } = await import('../data/words/n1')

  const LEVEL_MAP: Record<string, Array<{ id: string; kana: string }>> = {
    N5: N5_WORDS,
    N4: N4_WORDS,
    N3: N3_WORDS,
    N2: N2_WORDS,
    N1: N1_WORDS,
  }

  if (levelFilter) {
    const words = LEVEL_MAP[levelFilter]
    if (!words) {
      console.error(`Unknown level: ${levelFilter}. Use N5, N4, N3, N2, or N1.`)
      process.exit(1)
    }
    return tagLevel(words, levelFilter.toLowerCase())
  }

  return Object.entries(LEVEL_MAP).flatMap(([level, words]) => tagLevel(words, level.toLowerCase()))
}

// ── VOICEVOX API ─────────────────────────────

async function generateAudio(text: string, speakerId: number): Promise<Buffer> {
  const queryRes = await fetch(
    `${VOICEVOX_BASE}/audio_query?text=${encodeURIComponent(text)}&speaker=${speakerId}`,
    { method: 'POST' },
  )
  if (!queryRes.ok) {
    throw new Error(`audio_query failed (${queryRes.status}): ${await queryRes.text()}`)
  }
  const audioQuery = await queryRes.json()
  Object.assign(audioQuery, VOICE_OVERRIDES)

  const synthRes = await fetch(`${VOICEVOX_BASE}/synthesis?speaker=${speakerId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(audioQuery),
  })
  if (!synthRes.ok) {
    throw new Error(`synthesis failed (${synthRes.status}): ${await synthRes.text()}`)
  }
  return Buffer.from(await synthRes.arrayBuffer())
}

// ── WAV to MP3 conversion ───────────────────

function wavToMp3(wavBuffer: Buffer, outputPath: string, wordId: string): void {
  const tempWav = join(tmpdir(), `voicevox-${wordId}-${process.pid}.wav`)
  writeFileSync(tempWav, wavBuffer)
  try {
    execSync(`ffmpeg -i "${tempWav}" -codec:a libmp3lame -qscale:a 0 -y "${outputPath}"`, {
      stdio: 'pipe',
    })
  } finally {
    if (existsSync(tempWav)) unlinkSync(tempWav)
  }
}

// ── Retry wrapper ────────────────────��───────

async function withRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 1000): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      if (attempt === retries) throw err
      console.warn(`  Retry ${attempt}/${retries}: ${(err as Error).message}`)
      await new Promise((r) => setTimeout(r, delayMs * attempt))
    }
  }
  throw new Error('Unreachable')
}

// ── Process single word ─────────────────────

function wordOutputPath(word: WordEntry): string {
  return join(OUTPUT_DIR, word.level, `${word.id}.mp3`)
}

async function processWord(word: WordEntry, speakerId: number): Promise<void> {
  const outDir = join(OUTPUT_DIR, word.level)
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true })
  const outputPath = wordOutputPath(word)
  const wavBuffer = await generateAudio(word.kana, speakerId)
  wavToMp3(wavBuffer, outputPath, word.id)
}

// ── Manifest generation ─────────────────────

function buildManifest(words: WordEntry[]): void {
  const entries: Array<{ id: string; level: string }> = []
  for (const word of words) {
    if (existsSync(wordOutputPath(word))) {
      entries.push({ id: word.id, level: word.level })
    }
  }

  entries.sort((a, b) => a.id.localeCompare(b.id))

  const lines = [
    '// ─────────────────────────────────────────────',
    '// File: data/audio/word-manifest.ts',
    '// Purpose: Auto-generated manifest of words with audio files.',
    '//          Generated by scripts/generate-audio.ts. Do not edit manually.',
    '// Depends on: nothing',
    '// ─────────────────────────────────────────────',
    '',
    '// ── Manifest ─────────────────────────────────',
    '',
    'const WORD_AUDIO_MAP = new Map<string, string>([',
    ...entries.map((e) => `  ['${e.id}', '${e.level}'],`),
    '])',
    '',
    '// ── Helpers ──────────────────────────────────',
    '',
    'export function getWordAudioPath(wordId: string): string | null {',
    '  const level = WORD_AUDIO_MAP.get(wordId)',
    '  return level ? `/audio/words/${level}/${wordId}.mp3` : null',
    '}',
    '',
  ]

  writeFileSync(MANIFEST_PATH, lines.join('\n'))
  console.log(`\nManifest written: ${entries.length} entries -> ${MANIFEST_PATH}`)
}

// ── Process one level ───────────────────────

async function processLevel(words: WordEntry[], speaker: number): Promise<Stats> {
  const stats: Stats = { generated: 0, skipped: 0, errors: 0 }
  let processed = 0

  for (let i = 0; i < words.length; i += BATCH_SIZE) {
    const batch = words.slice(i, i + BATCH_SIZE)

    const results = await Promise.allSettled(
      batch.map((word) => {
        if (existsSync(wordOutputPath(word))) {
          stats.skipped++
          processed++
          return Promise.resolve()
        }
        return withRetry(() => processWord(word, speaker)).then(() => {
          stats.generated++
          processed++
        })
      }),
    )

    for (const result of results) {
      if (result.status === 'rejected') {
        stats.errors++
        processed++
        console.error(`  Error: ${result.reason}`)
      }
    }

    if (processed % 50 === 0 || processed === words.length) {
      console.log(`  [${processed}/${words.length}]`)
    }

    if (i + BATCH_SIZE < words.length) {
      await new Promise((r) => setTimeout(r, BATCH_DELAY_MS))
    }
  }

  return stats
}

// ── Main ─────────────────────────────────────

async function main(): Promise<void> {
  const { level, dryRun, speaker } = parseArgs()

  console.log('Loading word bank...')
  const allWords = await loadWords(level)
  console.log(`Total words: ${allWords.length}${level ? ` (${level} only)` : ''}`)

  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true })
  }

  // Group words by level (preserves order: n5, n4, n3, n2, n1)
  const levels = new Map<string, WordEntry[]>()
  for (const word of allWords) {
    const group = levels.get(word.level) ?? []
    group.push(word)
    levels.set(word.level, group)
  }

  // Dry run mode
  if (dryRun) {
    for (const [lvl, words] of levels) {
      const missing = words.filter((w) => !existsSync(wordOutputPath(w)))
      console.log(
        `\n${lvl.toUpperCase()}: ${missing.length} need generation out of ${words.length}`,
      )
      for (const w of missing.slice(0, 5)) {
        console.log(`  ${w.id}: ${w.kana}`)
      }
      if (missing.length > 5) console.log(`  ... and ${missing.length - 5} more`)
    }
    process.exit(0)
  }

  // Prerequisite checks
  await checkVoicevox()
  checkFfmpeg()

  console.log(`Speaker ID: ${speaker}`)
  console.log(`Output: ${OUTPUT_DIR}`)

  const totals: Stats = { generated: 0, skipped: 0, errors: 0 }

  for (const [lvl, words] of levels) {
    console.log(`\n── ${lvl.toUpperCase()} (${words.length} words) ──`)
    const stats = await processLevel(words, speaker)
    totals.generated += stats.generated
    totals.skipped += stats.skipped
    totals.errors += stats.errors
    console.log(
      `  Done: ${stats.generated} generated, ${stats.skipped} skipped, ${stats.errors} errors`,
    )
  }

  // Summary
  console.log(`\n── Total ──`)
  console.log(`  Generated: ${totals.generated}`)
  console.log(`  Skipped (exists): ${totals.skipped}`)
  console.log(`  Errors: ${totals.errors}`)

  // Build manifest
  buildManifest(allWords)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
