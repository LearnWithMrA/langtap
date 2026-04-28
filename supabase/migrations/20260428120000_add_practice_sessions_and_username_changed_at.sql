-- ─────────────────────────────────────────────
-- Migration: 20260428120000_add_practice_sessions_and_username_changed_at.sql
-- Purpose: Sprint 3 schema additions.
--          1. Creates the practice_sessions table for streak mechanic
--             and heatmap calendar (BACKEND.md Section 2.7).
--          2. Adds username_changed_at to profiles for 30-day cooldown
--             (BACKEND.md Section 2.7, SECURITY.md Section 5.1).
--          3. Adds distance_unit to profiles (BACKEND.md Section 2.2).
-- ─────────────────────────────────────────────


-- ── practice_sessions ────────────────────────
-- One row per user per local date. Tracks daily practice activity
-- for the streak engine and heatmap calendar on the home dashboard.
-- Timezone contract: local_date is the user-local calendar date,
-- not UTC. Streak evaluation runs from local_date values.

create table public.practice_sessions (
  id                   bigint generated always as identity primary key,
  user_id              uuid not null references auth.users(id) on delete cascade,
  event_at_utc         timestamptz not null default now(),
  user_tz              text not null default 'UTC',
  local_date           date not null,
  characters_practiced integer not null default 0
                         check (characters_practiced >= 0),
  unique (user_id, local_date)
);

create index practice_sessions_user_id_idx
  on public.practice_sessions using btree (user_id);
create index practice_sessions_local_date_idx
  on public.practice_sessions using btree (local_date);

alter table public.practice_sessions enable row level security;
alter table public.practice_sessions force row level security;

-- SELECT
create policy "Users read own practice sessions"
  on public.practice_sessions for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- INSERT
create policy "Users insert own practice sessions"
  on public.practice_sessions for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

-- UPDATE
create policy "Users update own practice sessions"
  on public.practice_sessions for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- DELETE: no policy defined. Client cannot delete rows.


-- ── profiles: add username_changed_at ────────
-- Nullable timestamptz. Null means the username has never been changed.
-- Server enforces: now() >= username_changed_at + interval '30 days'
-- before allowing a change.

alter table public.profiles
  add column if not exists username_changed_at timestamptz;


-- ── profiles: add distance_unit ──────────────
-- User preference for distance display (metric/imperial).

alter table public.profiles
  add column if not exists distance_unit text not null default 'metric'
    check (distance_unit in ('metric', 'imperial'));
