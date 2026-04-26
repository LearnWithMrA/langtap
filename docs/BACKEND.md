# LangTap - Backend

Version 1.0 | April 2026
Domain: Supabase schema, RLS policies, data flow, sync strategy, real-time,
migrations, and database conventions.
Reference: LangTap_Planning.md Sections 5.2, 5.3, 5.7, 5.15.
Owner document: CLAUDE.md
Related: docs/AUTH.md, docs/SECURITY.md, docs/ARCHITECTURE.md

Read this document before working in `services/`, writing SQL migrations,
or touching any Supabase configuration.

---

## 1. Core Principle

The database is the source of truth for user state. The app is a view over it.

All Supabase calls go through `services/`. No component, hook, or store calls
Supabase directly. The anon key only is used on the client. The service role key
never touches the client under any circumstances.

RLS must always be enabled on any table stored in an exposed schema.
With RLS enabled and no policies, the table is completely inaccessible. This is
the safest default. Enable RLS first, then define policies that grant access.

Every table created in this project follows this rule without exception.

---

## 2. Database Schema

### 2.1 Table Overview

| Table | Purpose |
|---|---|
| `profiles` | User preferences, Kotoba JLPT level, Kanji JLPT level, input mode, settings |
| `mastery` | Per-character mastery scores per user |
| `word_counters` | Per-word show counters per user |
| `leaderboard` | Cumulative mastery scores for global ranking |
| `unlock_state` | Which characters each user has unlocked |
| `practice_sessions` | Daily practice activity for streak mechanic and heatmap calendar |

All tables are in the `public` schema. All have RLS enabled.

### 2.2 profiles

Stores user preferences and settings. One row per user.

```sql
create table public.profiles (
  id                    uuid primary key references auth.users(id) on delete cascade,
  username              text not null unique,
  kotoba_jlpt_level     text not null default 'N5'
                          check (kotoba_jlpt_level in ('N5','N4','N3','N2','N1')),
  kanji_jlpt_level      text not null default 'N5'
                          check (kanji_jlpt_level in ('N5','N4','N3','N2','N1')),
  input_mode            text not null default 'tap'
                          check (input_mode in ('tap','type','swipe')),
  notifications_enabled boolean not null default false,
  font_family           text not null default 'Noto Sans JP',
  font_size             text not null default 'base',
  mnemonics_enabled     boolean not null default true,
  lofi_enabled          boolean not null default true,
  tap_reminder_count    integer not null default 0,
  onboarding_complete   boolean not null default false,
  username_changed_at   timestamptz,  -- last username change, null if never changed
  distance_unit         text not null default 'metric'
                          check (distance_unit in ('metric','imperial')),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.profiles force row level security;
```

RLS policies:

```sql
-- Users can read their own profile
create policy "Users read own profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

-- Users can update their own profile
create policy "Users update own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Profile is created on sign-up via trigger (see Section 5)
-- No insert policy needed for client; handled server-side
```

### 2.3 mastery

Stores one mastery score per user per kana character. This is the most-written
table in the app. Every correct first-attempt answer writes here.

```sql
create table public.mastery (
  id             bigint generated always as identity primary key,
  user_id        uuid not null references auth.users(id) on delete cascade,
  character_id   text not null,  -- matches ID from data/kana/characters.ts
  score          integer not null default 0 check (score >= 0),
  updated_at     timestamptz not null default now(),
  unique (user_id, character_id)
);

create index mastery_user_id_idx on public.mastery using btree (user_id);
create index mastery_character_id_idx on public.mastery using btree (character_id);

alter table public.mastery enable row level security;
```

RLS policies:

```sql
create policy "Users read own mastery"
  on public.mastery for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users insert own mastery"
  on public.mastery for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users update own mastery"
  on public.mastery for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
```

Note on `(select auth.uid())` wrapping: wrapping `auth.uid()` in a
`select` subquery causes the query planner to cache the result rather than calling
the function on every row, which can improve performance by over 100x on large
tables. Always use `(select auth.uid())` rather than bare `auth.uid()` in RLS
policies.

### 2.4 word_counters

Tracks how many times each word has been shown to a user. Resets per character
group when all words in a group reach the cap (handled in the engine, not here).

```sql
create table public.word_counters (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  word_id     text not null,  -- matches ID from data/words/
  count       integer not null default 0
                check (count >= 0 and count <= 5),
  updated_at  timestamptz not null default now(),
  unique (user_id, word_id)
);

create index word_counters_user_id_idx on public.word_counters using btree (user_id);

alter table public.word_counters enable row level security;
```

RLS policies: same pattern as `mastery`. User reads and writes only their own rows.

### 2.5 leaderboard

One row per user. Updated at session end, not on every answer.

```sql
create table public.leaderboard (
  id            bigint generated always as identity primary key,
  user_id       uuid not null references auth.users(id) on delete cascade unique,
  username      text not null,
  input_mode    text not null check (input_mode in ('tap','type','swipe')),
  total_score   integer not null default 0 check (total_score >= 0),
  updated_at    timestamptz not null default now()
);

create index leaderboard_total_score_idx on public.leaderboard
  using btree (total_score desc);

alter table public.leaderboard enable row level security;
```

RLS policies:

```sql
-- Anyone authenticated or anonymous can read the leaderboard
create policy "Leaderboard is public"
  on public.leaderboard for select
  to authenticated, anon
  using (true);

-- DELETE: no policy defined. Client cannot delete rows.
-- INSERT: no policy defined. Score writes go through a server-side
--   security definer function only (Sprint 9). No client can write
--   total_score directly - this was identified as a security risk
--   in Codex review (April 2026) and client write policies were removed.
-- UPDATE: no policy defined. Same reason as INSERT.
```

### 2.6 unlock_state

Tracks which characters each user has unlocked. A character is either unlocked
or not. The mastery score determines when it crosses the threshold.

Rather than a separate table, unlock state is derived from the `mastery` table:
a character is considered unlocked if its score >= `UNLOCK_THRESHOLD` (5), OR
if it appears in the `manual_unlocks` table below. This avoids a separate sync
and keeps the source of truth in one place.

```sql
create table public.manual_unlocks (
  id            bigint generated always as identity primary key,
  user_id       uuid not null references auth.users(id) on delete cascade,
  character_id  text not null,
  unlocked_at   timestamptz not null default now(),
  unique (user_id, character_id)
);

create index manual_unlocks_user_id_idx
  on public.manual_unlocks using btree (user_id);

alter table public.manual_unlocks enable row level security;
```

RLS policies: user reads and writes only their own rows.

The effective unlock state is computed client-side by the `unlock.store.ts` by
combining mastery scores >= threshold with the manual_unlocks set. No separate
unlock_state table is needed.

### 2.7 practice_sessions

Tracks daily practice activity per user. Used for the streak mechanic
(see docs/GAME_DESIGN.md Section 8.5) and the heatmap calendar on the
home dashboard. One row per user per local date.

```sql
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
```

RLS policies: same pattern as `mastery`. User reads and writes only
their own rows.

**Timezone contract:** the canonical streak date is the user-local
calendar date, not UTC. `event_at_utc` stores the raw timestamp,
`user_tz` stores the IANA timezone identifier (e.g. `Asia/Tokyo`),
and `local_date` is the derived date in that timezone. Streak
evaluation runs server-side from `local_date` values. The client
never computes streak state.

**Username change rate limit:** the `profiles.username_changed_at`
column tracks the last username change. Server enforces
`now() >= username_changed_at + interval '30 days'` before allowing
a change. Returns a structured error with the exact next-allowed
timestamp if the cooldown has not elapsed.

---

## 3. Data Flow

### 3.1 Session Flow

```
App starts
  -> Load user profile from Supabase (services/profile.service.ts)
  -> Load mastery scores from Supabase (services/mastery.service.ts)
  -> Load word counters from Supabase (services/counter.service.ts)
  -> Load manual unlocks from Supabase (services/unlock.service.ts)
  -> Hydrate Zustand stores with loaded data
  -> Compute unlock state from mastery + manual_unlocks
  -> Begin practice session

During practice
  -> Engine runs entirely in memory from Zustand store state
  -> No Supabase calls during active typing
  -> Mastery scores and counters update in Zustand only

Session ends (user navigates away or closes tab)
  -> Sync mastery store delta to Supabase (upsert changed rows only)
  -> Sync word counter delta to Supabase (upsert changed rows only)
  -> Sync leaderboard total score to Supabase
```

### 3.2 Write Strategy

Supabase is written to at session end, not on every correct answer. Writing on
every keypress would generate excessive traffic and degrade the experience.

The exception is manual unlocks, which write immediately when a user unlocks a
character in the Dojo, since this is a deliberate user action rather than a
continuous stream.

The delta strategy: each store tracks which character IDs or word IDs have changed
since the last sync. On sync, only changed rows are upserted. Unchanged rows are
not written.

```ts
// Pseudo-code for delta sync
const changedIds = masteryStore.getChangedSinceLastSync()
const rows = changedIds.map(id => ({
  user_id: userId,
  character_id: id,
  score: masteryStore.scores[id],
  updated_at: new Date().toISOString()
}))
await supabase.from('mastery').upsert(rows, { onConflict: 'user_id,character_id' })
masteryStore.clearChangedFlag()
```

### 3.3 Guest Users

Guest users have no Supabase rows. All state is held in Zustand and persisted
to `localStorage` via a Zustand middleware (zustand/middleware/persist).

On sign-up or log-in, the guest state in `localStorage` is migrated to Supabase.
The migration runs once immediately after auth completes and before the user
reaches the practice screen. If migration fails, the local state is preserved
and the user is notified to try again.

```
Guest state migration on account creation:
  1. Read all mastery scores from localStorage
  2. Read all word counters from localStorage
  3. Read all manual unlocks from localStorage
  4. Upsert all to Supabase
  5. Clear localStorage game state
  6. Hydrate stores from Supabase
```

---

## 4. Service Files

Each service file handles one domain. Services are plain async functions.
They never import from components, stores, or hooks.

### 4.1 services/supabase.ts

The Supabase client is initialised once here. All other services import from it.

```ts
// services/supabase.ts
import { createBrowserClient } from '@supabase/ssr'

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

For server components and route handlers, use `createServerClient` from
`@supabase/ssr` instead. Never share the same client instance between server
and client contexts.

### 4.2 services/mastery.service.ts

```ts
loadMastery(userId: string): Promise<ServiceResult<MasteryScoreMap>>
syncMastery(userId: string, delta: MasteryDelta): Promise<ServiceResult<void>>
```

### 4.3 services/counter.service.ts

```ts
loadCounters(userId: string): Promise<ServiceResult<WordCounterMap>>
syncCounters(userId: string, delta: CounterDelta): Promise<ServiceResult<void>>
```

### 4.4 services/leaderboard.service.ts

```ts
getLeaderboard(mode: InputMode): Promise<ServiceResult<LeaderboardEntry[]>>
getOverallLeaderboard(): Promise<ServiceResult<LeaderboardEntry[]>>
upsertScore(userId: string, entry: LeaderboardEntry): Promise<ServiceResult<void>>
```

### 4.5 services/unlock.service.ts (Sprint 4)

Not yet implemented. Interface planned:

```ts
loadManualUnlocks(userId: string): Promise<ServiceResult<string[]>>
addManualUnlock(userId: string, characterId: string): Promise<ServiceResult<void>>
```

---

## 5. Database Triggers

### 5.1 Profile Creation on Sign-Up

A database trigger creates a profile row automatically when a new user signs up.
This ensures every authenticated user always has a profile, and removes the need
for a client-side insert after sign-up.

```sql
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    'user_' || substr(new.id::text, 1, 8)  -- default username, user changes it
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

The default username (`user_` plus the first 8 characters of the UUID) is shown
during onboarding with a prompt to choose a real username.

---

## 6. Leaderboard Score Calculation

The leaderboard score is the sum of all mastery scores across all characters for
a user. It is computed in the service layer, not in SQL, to keep the logic in one
place with the rest of the engine.

```ts
// services/leaderboard.service.ts
function calculateTotalScore(scores: MasteryScoreMap): number {
  return Object.values(scores).reduce((sum, score) => sum + score, 0)
}
```

This is called at session end before upserting to the leaderboard table.

---

## 7. Real-Time

LangTap does not use Supabase real-time for the core game loop. Game state is
local and synced at session boundaries.

Real-time is used only for the leaderboard: new scores from other users are
pushed to connected clients so the leaderboard reflects recent changes without
requiring a manual refresh.

```ts
// Leaderboard real-time subscription (in hooks/useLeaderboard.ts)
supabase
  .channel('leaderboard-changes')
  .on(
    'postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'leaderboard' },
    (payload) => {
      // Update the local leaderboard state with the new entry
    }
  )
  .subscribe()
```

Realtime subscriptions respect RLS policies. Users only receive
updates for rows they can access. The leaderboard SELECT policy allowing all users
to read means all users receive real-time leaderboard updates.

---

## 8. Migrations

All schema changes are made via SQL migration files. Never alter the schema
directly in the Supabase dashboard without writing a corresponding migration file.

Migration files live in `supabase/migrations/`. Named as:
`YYYYMMDDHHMMSS_description.sql`

Example: `20260401120000_create_mastery_table.sql`

Rules:
- Migrations are append-only. Never edit a migration that has already been applied.
- Every migration must be tested in the local Supabase instance before applying
  to production. Use `supabase db reset` to apply all migrations locally.
- Never run a destructive migration (drop table, drop column) without explicit
  owner instruction. Flag it as a deletion and wait for approval.
- Every new table migration must include: the table creation, the RLS enable
  statement, and all RLS policies. These three things are always written together.

---

## 9. Indexes

Add indexes on any columns used within RLS policies. For a policy
like `auth.uid() = user_id`, add an index on `user_id`. Improvement can be over
100x on large tables.

Required indexes are defined in Section 2 alongside each table. Do not create a
new table without considering what indexes it needs.

Additional indexing rules:
- The leaderboard `total_score desc` index supports fast ranking queries.
- The `user_id` index on `mastery` and `word_counters` supports the most common
  query pattern (load all rows for a user).
- Do not add indexes speculatively. Add them when a table is created and when
  query performance evidence suggests they are needed.

---

## 10. What the AI Must Not Do

- Never call Supabase directly from a component, hook, or store.
- Never use the service role key on the client side.
- Never create a table without immediately enabling RLS.
- Never create a table without defining all necessary RLS policies in the same
  migration.
- Never delete a table, column, or row. Flag the need to the owner.
- Never alter a migration file that has already been applied.
- Never write to Supabase on every keypress or answer. Sync at session end only.
- Never expose raw Supabase error messages to the user interface.
- Never skip the `(select auth.uid())` wrapping in RLS policies.

---

*This document is the authoritative reference for all backend and database decisions.*
*If a service or migration conflicts with this document, the document wins.*
*Update this document before changing the schema, adding a table, or altering RLS.*
