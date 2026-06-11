# LangTap - Backend

Version 1.0 | April 2026
Domain: Supabase schema, RLS policies, data flow, sync strategy, real-time,
migrations, and database conventions.
Reference: LangTap_Planning.md Sections 5.2, 5.3, 5.7, 5.15.
Owner document: CLAUDE.md
Related: docs/AUTH.md, docs/SECURITY.md, docs/ARCHITECTURE.md

Read this document before working in `services/`, writing SQL migrations,
or touching any Supabase configuration.

**Integration test mandate:** Any change to RPCs, RLS policies, tables, or
migrations must include a corresponding integration test in
`services/__tests__/integration/`. Run `supabase db reset` then
`npm run test:integration` to verify. The runner
(`scripts/run-integration-tests.mjs`) reads the anon and service role keys
from `supabase status` automatically and fails fast if local Supabase is not
running. If the keys are absent, integration tests now report as SKIPPED in
the vitest output instead of silently passing. See CLAUDE.md Section 5D for
full rules.

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
| `profiles` | User preferences, JLPT level, input mode, settings, membership tier |
| `mastery` | Per-character mastery scores per user |
| `word_mastery` | Per-word mastery scores per user (Kotoba mode) |
| `word_counters` | Per-word show counters per user |
| `leaderboard` | (Legacy, unused) Original one-row-per-user leaderboard |
| `leaderboard_scores` | Aggregate leaderboard scores per (user, game_type, input_mode) |
| `leaderboard_score_events` | Per-completion events for idempotency and audit |
| `leaderboard_sessions` | Server-issued practice sessions for leaderboard scoring |
| `leaderboard_word_catalog` | Word catalog for server-side prompt validation |
| `kana_character_catalog` | Kana character catalog for validation (234 chars) |
| `unlock_state` | Which characters each user has unlocked |
| `word_manual_unlocks` | Which words each user has manually unlocked (Kotoba mode) |
| `practice_sessions` | Daily practice activity for streak mechanic and heatmap calendar |
| `practice_activity_events` | Per-batch events for idempotency (same pattern as leaderboard_score_events) |
| `daily_cap_events` | Per-prompt distance events for daily distance cap |
| `app_config` | Feature flags and app-wide configuration |
| `bug_reports` | User-submitted bug reports and feature requests (route-handler-only writes) |
| `guest_usage` | (Deprecated) Guest trial distance tracking. Flagged for removal. |

All tables are in the `public` schema. All have RLS enabled.

### 2.2 profiles

Stores user preferences and settings. One row per user.

```sql
create table public.profiles (
  id                    uuid primary key references auth.users(id) on delete cascade,
  username              text not null unique,
  jlpt_level            text not null default 'N5'
                          check (jlpt_level in ('N5','N4','N3','N2','N1')),
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
  leaderboard_visibility text not null default 'public'
                          check (leaderboard_visibility in ('public','hidden')),
  mastery_reset_epoch   integer not null default 0,
  word_mastery_reset_epoch integer not null default 0,
  user_tz               text not null default 'UTC',
  guest_imported_at     timestamptz,  -- guest import bookkeeping (deprecated flow)
  guest_import_skipped_at timestamptz,
  legacy_imported_at    timestamptz,  -- legacy import bookkeeping (deprecated flow)
  legacy_import_skipped_at timestamptz,
  input_direction       text not null default 'alternate'
                          check (input_direction in ('kana-to-romaji','romaji-to-kana','alternate')),
  kotoba_input          text not null default 'readings'
                          check (kotoba_input in ('readings','kanji')),
  hints_enabled         boolean not null default true,
  furigana_enabled      boolean not null default true,
  word_audio_enabled    boolean not null default true,
  key_clicks_enabled    boolean not null default false,
  auto_advance          text not null default 'delayed'
                          check (auto_advance in ('instant','delayed')),
  membership_tier       text not null default 'free'
                          check (membership_tier in ('free','monthly','annual','lifetime')),
  membership_expires_at timestamptz,
  stripe_customer_id    text unique,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.profiles force row level security;
```

`mastery_reset_epoch` and `word_mastery_reset_epoch` are domain-level
reset counters. Incremented by reset RPCs. Checkpoint sync RPCs require
an exact epoch match; stale or anomalous epochs reject the entire batch.
Both checkpoint and reset RPCs acquire `SELECT ... FOR UPDATE` on the
profiles row as a serialization point.

RLS policies (Sprint 10: permanent-user-only writes):

```sql
-- Users can read their own profile
create policy "Users read own profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

-- Permanent users can update their own profile
create policy "Permanent users update own profile"
  on public.profiles for update
  to authenticated
  using (
    (select auth.uid()) = id
    and public.is_permanent_user()
  )
  with check (
    (select auth.uid()) = id
    and public.is_permanent_user()
  );

-- Profile is created on sign-up via trigger (see Section 5)
-- No insert policy needed for client; handled server-side
```

**Membership columns (added 2026-06-11, migration `20260611120001_membership_schema.sql`):**
`membership_tier`, `membership_expires_at`, and `stripe_customer_id` are
readable by the user on their own row (existing SELECT policy, needed for UI)
but can never be changed by the client. The `guard_membership_change` trigger
(see Section 5.3) blocks any client update to these three columns; server-side
writers (future Stripe webhook, or the owner via SQL) set the
`app.allow_membership_change` setting to `'1'` inside the same transaction to
bypass the guard. A `security definer` helper `is_active_member(p_user_id uuid)`
returns true for lifetime tier or an unexpired monthly/annual tier; execute is
revoked from `public`, `anon`, and `authenticated` and granted to
`service_role` only, so clients cannot probe other users' member status.
`stripe_customer_id` is an opaque, non-secret identifier; write protection is
what matters.

### 2.3 mastery

Stores one mastery score per user per kana character. This is the most-written
table in the app. Every correct first-attempt answer writes here.

```sql
create table public.mastery (
  id             bigint generated always as identity primary key,
  user_id        uuid not null references auth.users(id) on delete cascade,
  character_id   text not null,  -- matches ID from data/kana/characters.ts
  score          integer not null default 0 check (score >= 0),
  learning_score integer not null default 0
                   check (learning_score >= 0 and learning_score <= 5),
  updated_at     timestamptz not null default now(),
  unique (user_id, character_id)
);

create index mastery_user_id_idx on public.mastery using btree (user_id);
create index mastery_character_id_idx on public.mastery using btree (character_id);

alter table public.mastery enable row level security;
```

`learning_score` tracks the character learning phase (0-5). Characters with
`learning_score >= 5` are eligible to appear in word practice. Separate from
`score`, which tracks word-practice proficiency with no upper bound. Both are
loaded together via `loadMasterySnapshot()`.

An `updated_at` trigger (`set_mastery_updated_at`) runs before every UPDATE
to set `updated_at = now()`, matching the `word_mastery` trigger pattern.

RLS policies (Sprint 10: permanent-user-only writes):

```sql
create policy "Users read own mastery"
  on public.mastery for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Permanent users insert own mastery"
  on public.mastery for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and public.is_permanent_user()
  );

create policy "Permanent users update own mastery"
  on public.mastery for update
  to authenticated
  using (
    (select auth.uid()) = user_id
    and public.is_permanent_user()
  )
  with check (
    (select auth.uid()) = user_id
    and public.is_permanent_user()
  );
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

### 2.5 leaderboard (legacy)

Original one-row-per-user leaderboard table. Replaced by `leaderboard_scores`
and `leaderboard_score_events` in Sprint 9. Left in place, not dropped.

### 2.10 leaderboard_scores

Aggregate leaderboard scores. One row per (user_id, game_type, input_mode).
Maximum 6 rows per user. Updated by the `record_leaderboard_completion` RPC.
Never written directly by the client.

```sql
create table public.leaderboard_scores (
  id            bigint generated always as identity primary key,
  user_id       uuid not null references auth.users(id) on delete cascade,
  game_type     text not null check (game_type in ('kana', 'kotoba')),
  input_mode    text not null check (input_mode in ('tap', 'type', 'swipe')),
  total_score   integer not null default 0 check (total_score >= 0),
  week_score    integer not null default 0 check (week_score >= 0),
  week_start    date not null default (date_trunc('week', now() at time zone 'UTC'))::date,
  updated_at    timestamptz not null default now(),
  unique (user_id, game_type, input_mode)
);
```

RLS: enabled + forced. No SELECT, INSERT, UPDATE, or DELETE policies.
All reads go through `get_leaderboard` RPC. All writes go through
`record_leaderboard_completion` RPC. Raw table is not exposed to clients.

Weekly scoring: `week_start` stores the Monday of the current scoring week
(UTC ISO). On first write after a new week, `week_score` resets to the
delta (lazy reset, no cron).

### 2.11 leaderboard_score_events

Per-completion events for idempotency and audit. One row per game completion.

```sql
create table public.leaderboard_score_events (
  event_id      uuid primary key,
  user_id       uuid not null references auth.users(id) on delete cascade,
  game_type     text not null check (game_type in ('kana', 'kotoba')),
  input_mode    text not null check (input_mode in ('tap', 'type', 'swipe')),
  score_delta   integer not null check (score_delta > 0),
  created_at    timestamptz not null default now()
);
```

RLS: enabled + forced. No policies. All access through RPCs.

Purpose: the `record_leaderboard_completion` RPC checks for an existing
`event_id` before applying a delta. If the event already exists, the RPC
returns silently (idempotent). This prevents double-counting on network
retries.

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

RLS policies: SELECT only. Users read their own rows. No INSERT or
UPDATE policies. All writes go through the `record_practice_activity`
RPC (see Section 4.9). Direct client writes are blocked.

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

### 2.8 word_mastery

Stores one mastery score per user per word. Kotoba mode equivalent of the
`mastery` table. Every correct first-attempt answer writes here.

```sql
create table public.word_mastery (
  id           bigint generated always as identity primary key,
  user_id      uuid not null references auth.users(id) on delete cascade,
  word_id      text not null,  -- matches ID from data/words/ word bank files
  score        integer not null default 0 check (score >= 0),
  updated_at   timestamptz not null default now(),
  unique (user_id, word_id)
);

create index word_mastery_user_id_idx on public.word_mastery using btree (user_id);

alter table public.word_mastery enable row level security;
alter table public.word_mastery force row level security;
```

RLS policies: same pattern as `mastery`. User reads, inserts, and updates
only their own rows. No DELETE policy.

An `updated_at` trigger (`set_word_mastery_updated_at`) runs before every
UPDATE to set `updated_at = now()`. The default `now()` only applies on
INSERT; the trigger ensures updates are timestamped correctly.

The `unique(user_id, word_id)` constraint creates a composite index that
covers the primary upsert query pattern. The standalone `user_id` index
supports RLS policy scans.

### 2.9 word_manual_unlocks

Tracks which words each user has manually unlocked. A word is considered
unlocked if it falls within the active progression step (via the
kotoba-progression engine) OR if it appears in this table.

```sql
create table public.word_manual_unlocks (
  id           bigint generated always as identity primary key,
  user_id      uuid not null references auth.users(id) on delete cascade,
  word_id      text not null,
  created_at   timestamptz not null default now(),
  unique (user_id, word_id)
);

create index word_manual_unlocks_user_id_idx
  on public.word_manual_unlocks using btree (user_id);

alter table public.word_manual_unlocks enable row level security;
alter table public.word_manual_unlocks force row level security;
```

RLS policies: user reads and inserts only their own rows. No UPDATE policy
(write-once semantics). No DELETE policy.

### 2.12 practice_activity_events

Per-batch events for idempotency and audit. One row per practice batch
flush. Prevents double-counting on network retries. Same pattern as
`leaderboard_score_events` (Section 2.11).

```sql
create table public.practice_activity_events (
  event_id         uuid primary key,
  user_id          uuid not null references auth.users(id) on delete cascade,
  characters_count integer not null check (characters_count > 0),
  local_date       date not null,
  created_at       timestamptz not null default now()
);

create index practice_activity_events_user_idx
  on public.practice_activity_events (user_id, created_at desc);

alter table public.practice_activity_events enable row level security;
alter table public.practice_activity_events force row level security;
```

RLS: enabled + forced. No policies. All access through the
`record_practice_activity` RPC (Section 4.9).

Purpose: the RPC checks for an existing `event_id` before applying a
batch. If the event already exists, the RPC returns silently (idempotent).
This prevents double-counting on network retries.

### 2.13 bug_reports

User-submitted bug reports and feature requests. All writes go through
the `/api/bug-report` route handler using the service role key. The table
has RLS enabled with no client-facing policies, making it completely
inaccessible to the anon key.

```sql
create table public.bug_reports (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  type             text not null check (type in ('bug', 'feature', 'other')),
  description      text not null check (char_length(description) <= 2000),
  screenshot_path  text,
  app_state        jsonb,
  user_agent       text,
  created_at       timestamptz not null default now()
);
```

Screenshots stored in private `bug-reports` storage bucket (5MB limit,
PNG/JPEG/WebP only). No client storage policies. Server-side rate gate:
one report per user per 60 seconds, enforced atomically by the
`submit_bug_report` RPC (see Section 4.10) since 2026-06-11. The route
handler validates auth, MIME, size, and length caps, uploads the screenshot,
then calls the RPC as the authoritative gate. If the RPC rejects the
submission, the route deletes the already-uploaded screenshot so orphaned
files do not accumulate in the bucket.

---

## 3. Data Flow

### 3.1 Session Flow

```
App starts
  -> Load user profile from Supabase (services/profile.service.ts)
  -> Load mastery scores from Supabase (services/mastery.service.ts)
  -> Load word mastery scores from Supabase (services/word-mastery.service.ts)
  -> Load word counters from Supabase (services/counter.service.ts)
  -> Load manual unlocks from Supabase (services/unlock.service.ts)
  -> Load word manual unlocks from Supabase (services/word-mastery.service.ts)
  -> Hydrate Zustand stores with loaded data
  -> Compute unlock state from mastery + manual_unlocks
  -> Sync server manual unlock IDs back to onboarding store (kana dojo reads from here)
  -> Compute word unlock state from word mastery + word_manual_unlocks
  -> Begin practice session

During practice
  -> Engine runs entirely in memory from Zustand store state
  -> No Supabase calls during active typing
  -> Mastery scores, word mastery scores, and counters update in Zustand only

Session ends (user navigates away or closes tab)
  -> Sync mastery store delta to Supabase (upsert changed rows only)
  -> Sync word mastery store delta to Supabase (upsert changed rows only)
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

### 3.2b Practice Session Recording

Practice activity is recorded via the `record_practice_activity` RPC for
the streak mechanic and heatmap calendar. The write path uses batching:
the client collects completions in memory and flushes a batch on every
10 completions, every 30 seconds, on tab hide, or on route navigation.
Each batch generates a UUID for idempotency via `practice_activity_events`.
Guests do not record practice activity.

The batching hook (`hooks/usePracticeActivityTracker.ts`) fires per
character correct in `practice-client.tsx`. The service
(`services/practice-session.service.ts`) wraps the RPC call.

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
  4. Read all word mastery scores from localStorage
  5. Read all word manual unlocks from localStorage
  6. Upsert all to Supabase
  7. Clear localStorage game state
  8. Hydrate stores from Supabase
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
recordLeaderboardCompletion(input: {
  eventId: string
  gameType: GameType
  inputMode: InputMode
  scoreDelta: number
}): Promise<ServiceResult<void>>

loadLeaderboard(
  gameType: GameType,
  inputMode: InputMode,
  period: TimePeriod,
): Promise<ServiceResult<LeaderboardBoard>>
```

`recordLeaderboardCompletion` calls the `record_leaderboard_completion` RPC.
Called per word completion from the game window. Accepts a bounded score
delta (1-20), not a client total. Idempotent via `eventId`.

`loadLeaderboard` calls the `get_leaderboard` RPC. Returns ranked entries
with hidden users filtered out and the current user's pinned row if they
are outside the top 50.

### 4.5 services/unlock.service.ts

```ts
loadManualUnlocks(userId: string): Promise<ServiceResult<string[]>>
syncManualUnlocks(userId: string, characterIds: string[]): Promise<ServiceResult<void>>
addManualUnlock(userId: string, characterId: string): Promise<ServiceResult<void>>
```

### 4.6 services/word-mastery.service.ts

```ts
loadWordMastery(userId: string): Promise<ServiceResult<WordMasteryScoreMap>>
syncWordMastery(userId: string, changedScores: WordMasteryScoreMap): Promise<ServiceResult<void>>
loadWordManualUnlocks(userId: string): Promise<ServiceResult<string[]>>
syncWordManualUnlocks(userId: string, wordIds: string[]): Promise<ServiceResult<void>>
```

### 4.7 services/factory-reset.service.ts

```ts
factoryReset(): Promise<ServiceResult<FactoryResetResult>>
```

`factoryReset` calls the `factory_reset` RPC (see Section 4.8). Returns both
new epoch values on success. Non-optimistic: the caller updates local state
only after RPC confirms.

### 4.8 factory_reset RPC

Atomic factory reset that clears all user progress in a single transaction.
Returns to an identical-to-new-account state. Uses a profile row lock
(`SELECT ... FOR UPDATE`) as the serialization point against concurrent
checkpoint syncs and other reset RPCs.

**Cleared:** `mastery`, `manual_unlocks`, `word_mastery`, `word_manual_unlocks`,
`word_counters`, `practice_sessions`, `practice_activity_events`,
`leaderboard_score_events`, `leaderboard_scores`, `leaderboard_sessions`,
`leaderboard` (legacy).
Also resets `profiles.tap_reminder_count` to 0.

**Preserved:** `daily_cap_events` (user stays capped for the day), all profile
settings (username, JLPT levels, input_mode, distance_unit, leaderboard_visibility,
notifications_enabled, font preferences, user_tz). Onboarding-selected character
unlocks (stored client-side in the onboarding store) are also preserved: factory
reset returns to post-onboarding state, not pre-onboarding. On next hydration the
store-hydrator merges onboarding unlocks back into the unlock store as expected.

**Epoch ownership:** the factory RPC increments both `mastery_reset_epoch` and
`word_mastery_reset_epoch` by 1 in a single UPDATE. It does NOT call the
existing `reset_all_mastery` or `reset_all_word_mastery` RPCs. This avoids
double-increment and ensures atomicity.

Returns: `{ new_mastery_epoch: integer, new_word_mastery_epoch: integer }`.

Security: `security definer`, rejects anonymous users via `is_permanent_user()`.
Granted to `authenticated` role only.

### 4.9 record_practice_activity RPC

Records practice activity for the streak mechanic and heatmap calendar.
Called per batch flush from the practice hooks (not per completion).

```ts
recordPracticeActivity(input: {
  completionId: string
  charactersCount: number
}): Promise<ServiceResult<PracticeActivityResult>>
```

**Parameters:**
- `p_completion_id` (uuid): client-generated batch ID for idempotency
- `p_characters_count` (integer, 1-1000): total characters in the batch

**Behaviour:**
1. Rejects unauthenticated and anonymous users
2. Validates `p_characters_count` (1-1000)
3. Idempotency: if `p_completion_id` already exists in
   `practice_activity_events`, returns current state without modification
4. Reads `user_tz` from `profiles` server-side (client does not pass tz)
5. Validates timezone against `pg_timezone_names`, falls back to UTC
6. Derives `local_date = (now() AT TIME ZONE user_tz)::date`
7. Inserts into `practice_activity_events`
8. Upserts `practice_sessions`: increments `characters_practiced`

**Returns:** `{ local_date, characters_practiced, inserted }`.

Security: `security definer`, `set search_path = public, pg_temp`.
Rejects anonymous users via `is_permanent_user()`. Granted to
`authenticated` role only. This is the only write path to
`practice_sessions` (direct INSERT/UPDATE policies removed).

### 4.10 submit_bug_report RPC

Added 2026-06-11 (migration `20260611120000_security_hardening.sql`).
Atomic bug report submission: rate gate plus insert in a single transaction.
Called only by the `/api/bug-report` route handler (service role client)
after the screenshot upload.

**Parameters:** `p_user_id uuid`, `p_type text`, `p_description text`,
`p_screenshot_path text`, `p_user_agent text`, `p_app_state jsonb`.

**Behaviour:**
1. Takes `pg_advisory_xact_lock(hashtext('bug_report:' || p_user_id))` to
   serialize concurrent submissions per user, closing the check-then-insert
   race the route handler alone could not prevent
2. Defense in depth: re-validates type (`bug`/`feature`/`other`) and
   description length (1-2000 chars) even though the route already checks
3. Rejects if the user's last report is less than 60 seconds old, returning
   `{ ok: false, error: 'rate_limited', retry_after: N }`
4. Inserts the report and returns `{ ok: true, id: <uuid> }`

Security: `security definer`. Execute is revoked from `public`, `anon`, and
`authenticated` and granted to `service_role` only, because `p_user_id` is
caller-supplied: the route handler passes the verified session user, and
clients must never be able to call it with an arbitrary user id. On a
rejected submission the route handler removes the orphan screenshot from
the `bug-reports` bucket (best effort).

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

### 5.2 Word Mastery updated_at Trigger

A trigger sets `updated_at = now()` on every UPDATE to `word_mastery`. The
column default (`now()`) only applies on INSERT; without this trigger,
`updated_at` would stay frozen at insert time after subsequent score changes.

```sql
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
```

Note: the existing `mastery` table (kana) has the same `updated_at` gap.
A future migration can add the same trigger pattern to `mastery` for
consistency.

### 5.3 Profile Write-Guard Triggers

Clients update their own `profiles` row for settings, so column-level
protection uses BEFORE UPDATE triggers rather than RLS.

**`guard_username_change`:** blocks direct client updates to `username` and
`username_changed_at`; changes must go through the `change_username` RPC,
which sets `app.allow_username_change = '1'` inside its transaction to
bypass the guard. Fixed 2026-06-11 (migration
`20260611120000_security_hardening.sql`): the original guard compared
`current_setting(..., true) != '1'`, but `current_setting` returns NULL when
the setting is unset, and `NULL != '1'` evaluates to NULL (falsy), so the
exception never fired and a direct client UPDATE could bypass the 30-day
cooldown. The fix wraps the call in `coalesce(..., '')`.

**`guard_membership_change`:** same pattern (with the `coalesce` fix from
day one). Blocks client updates to `membership_tier`,
`membership_expires_at`, and `stripe_customer_id`. Server-side writers set
`app.allow_membership_change = '1'` in the same transaction. See Section 2.2.

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

The leaderboard does not use real-time either. Current leaderboard reads go
through the `get_leaderboard` RPC (`hooks/useLeaderboard.ts` fetches on demand),
and `leaderboard_scores` has no client-facing policies, so a `postgres_changes`
subscription on it would receive nothing. The legacy `leaderboard` table is
unused. If real-time leaderboard updates are added in a future sprint, they
must be driven by an RPC-compatible mechanism (e.g. broadcast), not by a
direct table subscription.

Realtime subscriptions respect RLS policies. Users only receive
updates for rows they can access.

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
