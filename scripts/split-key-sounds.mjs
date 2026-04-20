// ------------------------------------------------------------
// File: scripts/split-key-sounds.mjs
// Purpose: One-time script. Slices public/sounds/keys.ogg into
//          per-id ogg files at public/sounds/keys/{id}.ogg using
//          the offsets defined in data/audio/key-sound-map.ts.
//          Run: node scripts/split-key-sounds.mjs
// Depends on: ffmpeg on PATH
// ------------------------------------------------------------

import { execFile } from 'node:child_process'
import { mkdir, rm } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const execFileP = promisify(execFile)

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const SOURCE = resolve(ROOT, 'public/sounds/keys.ogg')
const OUT_DIR = resolve(ROOT, 'public/sounds/keys')

// Mirror of KEY_SOUND_MAP (see data/audio/key-sound-map.ts).
// Inlined here because this is a one-time script run outside the TS build.
const LETTERS = {
  a: [22869, 109],
  b: [29909, 98],
  c: [29557, 112],
  d: [23586, 103],
  e: [16964, 105],
  f: [23898, 98],
  g: [24237, 102],
  h: [24550, 106],
  i: [18643, 110],
  j: [24917, 103],
  k: [25274, 102],
  l: [25625, 101],
  m: [30605, 101],
  n: [30252, 112],
  o: [18994, 98],
  p: [19331, 108],
  q: [16284, 83],
  r: [17275, 102],
  s: [23237, 98],
  t: [17613, 108],
  u: [18301, 105],
  v: [29557, 112],
  w: [16637, 97],
  x: [28855, 101],
  y: [17957, 95],
  z: [28550, 92],
}

const NUMBERS = {
  0: [12337, 108],
  1: [2280, 109],
  2: [9444, 102],
  3: [9833, 103],
  4: [10185, 107],
  5: [10551, 108],
  6: [10899, 107],
  7: [11282, 99],
  8: [11623, 103],
  9: [11976, 110],
}

const FUNCTIONAL = {
  space: [33857, 100],
  enter: [26703, 100],
  backspace: [13765, 101],
}

const UI = {
  'ui-logo': [33857, 100],
  'ui-settings': [9069, 115],
  'ui-profile': [2754, 104],
  'ui-home': [3155, 99],
  'ui-kana-dojo': [3545, 103],
  'ui-kotoba-dojo': [3913, 100],
  'ui-leaderboard': [4305, 96],
  'ui-mode-kana': [26703, 100],
  'ui-mode-kotoba': [15916, 97],
  'ui-mode-switch': [22560, 100],
  'ui-audio-toggle': [8036, 92],
  'ui-dropdown': [20387, 97],
  'ui-nav-click': [4666, 103],
  'ui-soft': [8036, 92],
  'ui-tap-correct': [5034, 110],
  'ui-tap-wrong': [7322, 97],
}

const MAP = { ...LETTERS, ...NUMBERS, ...FUNCTIONAL, ...UI }

async function sliceOne(id, startMs, durationMs) {
  const out = resolve(OUT_DIR, `${id}.ogg`)
  // Small padding (+20ms duration) gives the vorbis encoder headroom
  // so the slice ends cleanly. AudioBufferSourceNode.start() with
  // duration in useKeySound will stop at the exact intended length.
  const args = [
    '-hide_banner',
    '-loglevel',
    'error',
    '-ss',
    (startMs / 1000).toFixed(3),
    '-t',
    ((durationMs + 20) / 1000).toFixed(3),
    '-i',
    SOURCE,
    '-c:a',
    'libopus',
    '-b:a',
    '64k',
    '-y',
    out,
  ]
  await execFileP('ffmpeg', args)
}

async function main() {
  await rm(OUT_DIR, { recursive: true, force: true })
  await mkdir(OUT_DIR, { recursive: true })

  const entries = Object.entries(MAP)
  let done = 0
  for (const [id, [startMs, durationMs]] of entries) {
    await sliceOne(id, startMs, durationMs)
    done++
    process.stdout.write(`\rsliced ${done}/${entries.length}`)
  }
  process.stdout.write('\n')
  console.log(`wrote ${entries.length} files to ${OUT_DIR}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
