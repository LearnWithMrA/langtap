// ─────────────────────────────────────────────
// File: data/audio/lofi-tracks.ts
// Purpose: Lo-fi background music track list. All tracks are
//          CC0 (public domain) by HoliznaCC0. No attribution required.
// Depends on: nothing
// ─────────────────────────────────────────────

export type LofiTrack = {
  readonly id: string
  readonly title: string
  readonly path: string
}

export const LOFI_TRACKS: readonly LofiTrack[] = [
  { id: 'bubbles', title: 'Bubbles', path: '/audio/lofi/bubbles.mp3' },
  { id: 'peaceful-drift', title: 'Peaceful Drift', path: '/audio/lofi/peaceful_drift.mp3' },
  { id: 'going-home', title: 'Going Home', path: '/audio/lofi/going_home.mp3' },
  { id: 'warm-fuzz', title: 'Warm Fuzz', path: '/audio/lofi/warm_fuzz.mp3' },
  { id: 'color-of-a-soul', title: 'Color Of A Soul', path: '/audio/lofi/color_of_a_soul.mp3' },
  {
    id: 'ode-to-forgetting',
    title: 'Ode To Forgetting',
    path: '/audio/lofi/ode_to_forgetting.mp3',
  },
  { id: 'saturation', title: 'Saturation', path: '/audio/lofi/saturation.mp3' },
  { id: 'wave-maker', title: 'Wave Maker', path: '/audio/lofi/wave_maker.mp3' },
  {
    id: 'complicated-feelings',
    title: 'Complicated Feelings',
    path: '/audio/lofi/complicated_feelings.mp3',
  },
  { id: 'wetlands', title: 'Wetlands', path: '/audio/lofi/wetlands.mp3' },
  { id: 'dreamshifter', title: 'Dreamshifter', path: '/audio/lofi/dreamshifter.mp3' },
  { id: 'dreamy-reverie', title: 'Dreamy Reverie', path: '/audio/lofi/dreamy_reverie.mp3' },
  { id: 'ease-into-night', title: 'Ease Into Night', path: '/audio/lofi/ease_into_night.mp3' },
  { id: 'infinite-echoes', title: 'Infinite Echoes', path: '/audio/lofi/infinite_echoes.mp3' },
  { id: 'into-the-mist', title: 'Into The Mist', path: '/audio/lofi/into_the_mist.mp3' },
  { id: 'lucid', title: 'Lucid', path: '/audio/lofi/lucid.mp3' },
  { id: 'never-sleeping', title: 'Never Sleeping', path: '/audio/lofi/never_sleeping.mp3' },
]
