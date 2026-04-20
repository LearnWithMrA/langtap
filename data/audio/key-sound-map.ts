// ------------------------------------------------------------
// File: data/audio/key-sound-map.ts
// Purpose: Maps sound IDs to individual audio files under
//          /sounds/keys/. Files were split from the original
//          keys.ogg sprite via scripts/split-key-sounds.mjs.
//          Letter keys map to typing input sounds. Other keys
//          are mapped to UI actions for variety.
// Depends on: nothing
// ------------------------------------------------------------

// -- Constants ---------------------------------------------

const KEYS_DIR = '/sounds/keys'

const ALL_IDS = [
  // Letters
  'a',
  'b',
  'c',
  'd',
  'e',
  'f',
  'g',
  'h',
  'i',
  'j',
  'k',
  'l',
  'm',
  'n',
  'o',
  'p',
  'q',
  'r',
  's',
  't',
  'u',
  'v',
  'w',
  'x',
  'y',
  'z',
  // Numbers
  '0',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  // Functional
  'space',
  'enter',
  'backspace',
  // UI actions
  'ui-logo',
  'ui-settings',
  'ui-profile',
  'ui-home',
  'ui-kana-dojo',
  'ui-kotoba-dojo',
  'ui-leaderboard',
  'ui-mode-kana',
  'ui-mode-kotoba',
  'ui-mode-switch',
  'ui-audio-toggle',
  'ui-dropdown',
  'ui-nav-click',
  'ui-soft',
  'ui-tap-correct',
  'ui-tap-wrong',
] as const

// -- Main export -------------------------------------------

export const KEY_SOUND_MAP: Record<string, string> = Object.fromEntries(
  ALL_IDS.map((id) => [id, `${KEYS_DIR}/${id}.ogg`]),
)
