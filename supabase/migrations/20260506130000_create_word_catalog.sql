-- ---------------------------------------------------------
-- Migration: 20260506130000_create_word_catalog.sql
-- Purpose: Lightweight word catalog for server-derived leaderboard
--          scoring. Stores expected romaji, kana, and kanji per word
--          so the server can verify client-submitted attempts.
-- ---------------------------------------------------------

create table public.leaderboard_word_catalog (
  word_id          text primary key,
  char_count       smallint not null check (char_count between 1 and 15),
  has_kanji        boolean not null default false,
  expected_romaji  jsonb not null,
  expected_kana    jsonb not null,
  kanji            text
);

alter table public.leaderboard_word_catalog enable row level security;
alter table public.leaderboard_word_catalog force row level security;
