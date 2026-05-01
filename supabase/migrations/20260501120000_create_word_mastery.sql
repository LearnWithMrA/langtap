-- ─────────────────────────────────────────────
-- Migration: 20260501120000_create_word_mastery.sql
-- Purpose: Creates word mastery and word manual unlock tables for
--          Kotoba (vocabulary) mode. Mirrors the kana mastery and
--          manual_unlocks tables but scoped to word IDs.
--          Includes an updated_at trigger for word_mastery (the kana
--          mastery table has the same gap; a future migration can
--          backfill that trigger).
-- Tables: word_mastery, word_manual_unlocks
-- Trigger: set_word_mastery_updated_at
-- ─────────────────────────────────────────────


-- ── word_mastery ─────────────────────────────
-- One row per user per word. Tracks cumulative mastery score.
-- word_id matches the ID field in data/words/ word bank files.
-- Score has no upper bound; higher means better known.
-- The unique constraint on (user_id, word_id) also serves as the
-- composite index for upsert operations.

create table if not exists public.word_mastery (
  id           bigint generated always as identity primary key,
  user_id      uuid not null references auth.users(id) on delete cascade,
  word_id      text not null,
  score        integer not null default 0 check (score >= 0),
  updated_at   timestamptz not null default now(),
  unique (user_id, word_id)
);

-- RLS scan index (user_id appears in every policy's WHERE clause)
create index if not exists word_mastery_user_id_idx
  on public.word_mastery using btree (user_id);

alter table public.word_mastery enable row level security;
alter table public.word_mastery force row level security;

-- SELECT: user can read their own word mastery scores
create policy "Users read own word mastery"
  on public.word_mastery for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- INSERT: WITH CHECK only (no existing row to evaluate with USING)
create policy "Users insert own word mastery"
  on public.word_mastery for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

-- UPDATE: both USING and WITH CHECK required
create policy "Users update own word mastery"
  on public.word_mastery for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- DELETE: no policy defined. Client cannot delete rows.
-- Deletions are manual owner operations only (service role, direct DB access).


-- ── updated_at trigger ───────────────────────
-- Automatically sets updated_at to now() on every UPDATE.
-- The default now() only applies on INSERT; without this trigger,
-- updated_at would stay frozen at insert time after updates.

create or replace function public.set_word_mastery_updated_at()
returns trigger
language plpgsql
security definer set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger word_mastery_set_updated_at
  before update on public.word_mastery
  for each row execute procedure public.set_word_mastery_updated_at();


-- ── word_manual_unlocks ──────────────────────
-- One row per user per manually unlocked word.
-- A word is considered unlocked if it appears in the active
-- progression step (via kotoba-progression engine) OR if it
-- appears in this table. Effective unlock state is computed
-- client-side in stores/word-mastery.store.ts by combining
-- both sources.
-- Write-once semantics: rows are only inserted, never updated.

create table if not exists public.word_manual_unlocks (
  id           bigint generated always as identity primary key,
  user_id      uuid not null references auth.users(id) on delete cascade,
  word_id      text not null,
  created_at   timestamptz not null default now(),
  unique (user_id, word_id)
);

-- RLS scan index
create index if not exists word_manual_unlocks_user_id_idx
  on public.word_manual_unlocks using btree (user_id);

alter table public.word_manual_unlocks enable row level security;
alter table public.word_manual_unlocks force row level security;

-- SELECT: user can read their own word unlocks
create policy "Users read own word manual unlocks"
  on public.word_manual_unlocks for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- INSERT: WITH CHECK only (write-once, no existing row to evaluate)
create policy "Users insert own word manual unlocks"
  on public.word_manual_unlocks for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

-- No UPDATE policy: word unlocks are write-once, never modified.
-- No DELETE policy: client cannot delete rows.
