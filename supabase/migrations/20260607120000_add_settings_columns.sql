-- Add settings columns to profiles so preferences sync across devices.
-- input_mode already exists. Add the remaining settings with safe defaults.

alter table public.profiles
  add column if not exists input_direction text not null default 'alternate'
    check (input_direction in ('kana-to-romaji', 'romaji-to-kana', 'alternate')),
  add column if not exists kotoba_input text not null default 'readings'
    check (kotoba_input in ('readings', 'kanji')),
  add column if not exists hints_enabled boolean not null default true,
  add column if not exists furigana_enabled boolean not null default true,
  add column if not exists word_audio_enabled boolean not null default true,
  add column if not exists key_clicks_enabled boolean not null default false,
  add column if not exists auto_advance text not null default 'delayed'
    check (auto_advance in ('instant', 'delayed'));
