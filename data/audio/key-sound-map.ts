// ------------------------------------------------------------
// File: data/audio/key-sound-map.ts
// Purpose: Maps sound IDs to [startMs, durationMs] slices in
//          the audio sprite at public/sounds/keys.ogg.
//          Sourced from the Keyboard project's SOUND_DEFINES_DOWN.
//          Letter keys map to typing input sounds. Other keys
//          are mapped to UI actions for variety.
// Depends on: nothing
// ------------------------------------------------------------

// -- Types --------------------------------------------------

type SoundSlice = [startMs: number, durationMs: number]

// -- Letter keys (typing input) -----------------------------

const LETTERS: Record<string, SoundSlice> = {
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

// -- Number keys --------------------------------------------

const NUMBERS: Record<string, SoundSlice> = {
  '0': [12337, 108],
  '1': [2280, 109],
  '2': [9444, 102],
  '3': [9833, 103],
  '4': [10185, 107],
  '5': [10551, 108],
  '6': [10899, 107],
  '7': [11282, 99],
  '8': [11623, 103],
  '9': [11976, 110],
}

// -- Functional keys ----------------------------------------

const FUNCTIONAL: Record<string, SoundSlice> = {
  space: [33857, 100],
  enter: [26703, 100],
  backspace: [13765, 101],
}

// -- UI action sounds (mapped from non-letter keys) ---------

const UI: Record<string, SoundSlice> = {
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

// -- Combined map -------------------------------------------

export const KEY_SOUND_MAP: Record<string, SoundSlice> = {
  ...LETTERS,
  ...NUMBERS,
  ...FUNCTIONAL,
  ...UI,
}

export const SOUND_SPRITE_URL = '/sounds/keys.ogg'
