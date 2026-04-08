-- ─────────────────────────────────────────────
-- Migration: 20260407120000_create_initial_schema.sql
-- Purpose: Creates all five core tables for LangTap Phase 1 (Kana MVP).
--          Each table is created with RLS enabled and force-enabled,
--          all policies defined, and no client-facing DELETE policies.
-- Tables: profiles, mastery, word_counters, leaderboard, manual_unlocks
-- Trigger: handle_new_user - creates a profile row on sign-up
-- ─────────────────────────────────────────────


-- ── profiles ─────────────────────────────────
-- One row per user. Stores preferences and settings.
-- Created automatically on sign-up via the handle_new_user trigger (see below).

create table public.profiles (
  id                    uuid primary key references auth.users(id) on delete cascade,
  username              text not null unique,
  jlpt_level            text not null default 'N5'
                          check (jlpt_level in ('N5', 'N4', 'N3', 'N2', 'N1')),
  input_mode            text not null default 'tap'
                          check (input_mode in ('tap', 'type', 'swipe')),
  notifications_enabled boolean not null default false,
  font_family           text not null default 'Noto Sans JP',
  font_size             text not null default 'base',
  mnemonics_enabled     boolean not null default true,
  lofi_enabled          boolean not null default true,
  tap_reminder_count    integer not null default 0,
  onboarding_complete   boolean not null default false,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.profiles force row level security;

-- SELECT: user can read their own profile
create policy "Users read own profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

-- UPDATE: user can update their own profile
-- Both USING (identify the row) and WITH CHECK (validate new data) are required.
create policy "Users update own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- INSERT: no client policy. Profile is created by the handle_new_user trigger (see below).

-- DELETE: no policy defined. Client cannot delete rows.
-- Deletions are manual owner operations only (service role, direct DB access).


-- ── mastery ───────────────────────────────────
-- One row per user per kana character.
-- The most frequently written table in the app.
-- character_id matches the ID field in data/kana/characters.ts.

create table public.mastery (
  id             bigint generated always as identity primary key,
  user_id        uuid not null references auth.users(id) on delete cascade,
  character_id   text not null,
  score          integer not null default 0 check (score >= 0),
  updated_at     timestamptz not null default now(),
  unique (user_id, character_id)
);

create index mastery_user_id_idx on public.mastery using btree (user_id);
create index mastery_character_id_idx on public.mastery using btree (character_id);

alter table public.mastery enable row level security;
alter table public.mastery force row level security;

-- SELECT
create policy "Users read own mastery"
  on public.mastery for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- INSERT: WITH CHECK only (no existing row to evaluate with USING on insert)
create policy "Users insert own mastery"
  on public.mastery for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

-- UPDATE: both USING and WITH CHECK required
create policy "Users update own mastery"
  on public.mastery for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- DELETE: no policy defined. Client cannot delete rows.
-- Deletions are manual owner operations only (service role, direct DB access).


-- ── word_counters ─────────────────────────────
-- One row per user per word. Tracks how many times each word has been shown.
-- count is capped at 5; reset logic is handled in the engine (engine/counter.ts).
-- word_id matches the ID field in data/words/.

create table public.word_counters (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  word_id     text not null,
  count       integer not null default 0
                check (count >= 0 and count <= 5),
  updated_at  timestamptz not null default now(),
  unique (user_id, word_id)
);

create index word_counters_user_id_idx on public.word_counters using btree (user_id);

alter table public.word_counters enable row level security;
alter table public.word_counters force row level security;

-- SELECT
create policy "Users read own word counters"
  on public.word_counters for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- INSERT: WITH CHECK only
create policy "Users insert own word counters"
  on public.word_counters for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

-- UPDATE: both USING and WITH CHECK required
create policy "Users update own word counters"
  on public.word_counters for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- DELETE: no policy defined. Client cannot delete rows.
-- Deletions are manual owner operations only (service role, direct DB access).


-- ── leaderboard ───────────────────────────────
-- One row per user. Updated at session end via a server-side function only.
-- Client has read access (all rows). Client has no write access.
-- total_score is never written directly from the client.

create table public.leaderboard (
  id            bigint generated always as identity primary key,
  user_id       uuid not null references auth.users(id) on delete cascade unique,
  username      text not null,
  input_mode    text not null check (input_mode in ('tap', 'type', 'swipe')),
  total_score   integer not null default 0 check (total_score >= 0),
  updated_at    timestamptz not null default now()
);

-- Index supports fast ranking queries (ORDER BY total_score DESC)
create index leaderboard_total_score_idx on public.leaderboard
  using btree (total_score desc);

alter table public.leaderboard enable row level security;
alter table public.leaderboard force row level security;

-- SELECT: public read - all authenticated and anonymous users can view the leaderboard
create policy "Leaderboard is public"
  on public.leaderboard for select
  to authenticated, anon
  using (true);

-- INSERT: no client policy. Writes go through a server-side security definer
-- function (to be built in Sprint 9) that validates the score before writing.

-- UPDATE: no client policy. Same as above - server-side only.

-- DELETE: no policy defined. Client cannot delete rows.
-- Deletions are manual owner operations only (service role, direct DB access).


-- ── manual_unlocks ────────────────────────────
-- One row per user per manually unlocked character.
-- A character is considered unlocked if its mastery score >= UNLOCK_THRESHOLD (5)
-- OR if it appears in this table. Effective unlock state is computed client-side
-- in stores/unlock.store.ts by combining both sources.

create table public.manual_unlocks (
  id            bigint generated always as identity primary key,
  user_id       uuid not null references auth.users(id) on delete cascade,
  character_id  text not null,
  unlocked_at   timestamptz not null default now(),
  unique (user_id, character_id)
);

create index manual_unlocks_user_id_idx on public.manual_unlocks
  using btree (user_id);

alter table public.manual_unlocks enable row level security;
alter table public.manual_unlocks force row level security;

-- SELECT
create policy "Users read own manual unlocks"
  on public.manual_unlocks for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- INSERT: WITH CHECK only
create policy "Users insert own manual unlocks"
  on public.manual_unlocks for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

-- UPDATE: both USING and WITH CHECK required
create policy "Users update own manual unlocks"
  on public.manual_unlocks for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- DELETE: no policy defined. Client cannot delete rows.
-- Deletions are manual owner operations only (service role, direct DB access).


-- ── Trigger: handle_new_user ──────────────────
-- Creates a profile row automatically when a new user signs up via Supabase Auth.
-- This ensures every authenticated user always has a profile row.
-- The default username uses the first 8 characters of the UUID; the user
-- chooses a real username during onboarding.
--
-- Security notes:
--   security definer: function runs with owner privileges so it can write to profiles
--   set search_path = public, pg_temp: scopes name resolution, prevents search path injection
--   on conflict (id) do nothing: idempotent - safe to replay on db reset or trigger re-fire

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public, pg_temp
as $$
begin
  insert into profiles (id, username)
  values (
    new.id,
    'user_' || substr(new.id::text, 1, 8)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
