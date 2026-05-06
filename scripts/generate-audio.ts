// ─────────────────────────────────────────────
// File: scripts/generate-audio.ts
// Purpose: Calls the local VOICEVOX API for every word in the word
//          bank, generates MP3 files, and builds the word-manifest.
//          Incremental: re-running only generates missing files.
//          Run with: npx tsx scripts/generate-audio.ts [--level N5]
//                    [--dry-run] [--speaker 3]
// Depends on: data/words/n5..n1, VOICEVOX running at localhost:50021,
//             ffmpeg installed
// ─────────────────────────────────────────────

import { existsSync, mkdirSync, writeFileSync, unlinkSync, readFileSync } from 'node:fs'
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
const DEFAULT_SPEAKER = 3

// ── Types ────────────────────────────────────

type WordEntry = {
  id: string
  kana: string
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

async function loadWords(levelFilter: string | null): Promise<WordEntry[]> {
  const { N5_WORDS } = await import('../data/words/n5')
  const { N4_WORDS } = await import('../data/words/n4')
  const { N3_WORDS } = await import('../data/words/n3')
  const { N2_WORDS } = await import('../data/words/n2')
  const { N1_WORDS } = await import('../data/words/n1')

  const LEVEL_MAP: Record<string, WordEntry[]> = {
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
    return words
  }

  return Object.values(LEVEL_MAP).flat()
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
    execSync(`ffmpeg -i "${tempWav}" -codec:a libmp3lame -qscale:a 4 -y "${outputPath}"`, {
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

async function processWord(word: WordEntry, speakerId: number): Promise<void> {
  const outputPath = join(OUTPUT_DIR, `${word.id}.mp3`)
  const wavBuffer = await generateAudio(word.kana, speakerId)
  wavToMp3(wavBuffer, outputPath, word.id)
}

// ── Manifest generation ─────────────────────

function buildManifest(words: WordEntry[]): void {
  const existingIds: string[] = []
  for (const word of words) {
    if (existsSync(join(OUTPUT_DIR, `${word.id}.mp3`))) {
      existingIds.push(word.id)
    }
  }

  existingIds.sort()

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
    'export const WORDS_WITH_AUDIO = new Set<string>([',
    ...existingIds.map((id) => `  '${id}',`),
    '])',
    '',
    '// ── Helpers ──────────────────────────────────',
    '',
    'export function getWordAudioPath(wordId: string): string | null {',
    '  return WORDS_WITH_AUDIO.has(wordId) ? `/audio/words/${wordId}.mp3` : null',
    '}',
    '',
  ]

  writeFileSync(MANIFEST_PATH, lines.join('\n'))
  console.log(`\nManifest written: ${existingIds.length} entries -> ${MANIFEST_PATH}`)
}

// ── Main ─────────────────────────────────────

async function main(): Promise<void> {
  const { level, dryRun, speaker } = parseArgs()

  console.log('Loading word bank...')
  const words = await loadWords(level)
  console.log(`Total words: ${words.length}${level ? ` (${level} only)` : ''}`)

  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true })
  }

  // Dry run mode
  if (dryRun) {
    const missing = words.filter((w) => !existsSync(join(OUTPUT_DIR, `${w.id}.mp3`)))
    console.log(`\nDry run: ${missing.length} files need generation out of ${words.length} total`)
    for (const w of missing.slice(0, 20)) {
      console.log(`  ${w.id}: ${w.kana}`)
    }
    if (missing.length > 20) console.log(`  ... and ${missing.length - 20} more`)
    process.exit(0)
  }

  // Prerequisite checks
  await checkVoicevox()
  checkFfmpeg()

  console.log(`Speaker ID: ${speaker}`)
  console.log(`Output: ${OUTPUT_DIR}`)
  console.log('')

  const stats: Stats = { generated: 0, skipped: 0, errors: 0 }
  let processed = 0

  // Batch processing
  for (let i = 0; i < words.length; i += BATCH_SIZE) {
    const batch = words.slice(i, i + BATCH_SIZE)

    const results = await Promise.allSettled(
      batch.map((word) => {
        const outputPath = join(OUTPUT_DIR, `${word.id}.mp3`)
        if (existsSync(outputPath)) {
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
      console.log(`[${processed}/${words.length}] Progress`)
    }

    if (i + BATCH_SIZE < words.length) {
      await new Promise((r) => setTimeout(r, BATCH_DELAY_MS))
    }
  }

  // Summary
  console.log(`\nDone: ${words.length} words processed`)
  console.log(`  Generated: ${stats.generated}`)
  console.log(`  Skipped (exists): ${stats.skipped}`)
  console.log(`  Errors: ${stats.errors}`)

  // Build manifest
  buildManifest(words)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
