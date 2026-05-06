-- ─────────────────────────────────────────────
-- Migration: 20260507120000_fix_anonymous_rls_and_add_epoch.sql
-- Purpose: Sprint 10, Phase 0a + 0b combined.
--   0a: Fix broken anonymous write blocking RLS policies.
--       The original "block anonymous" policies (20260504120000) are
--       permissive and OR'd with base allow policies, so they have no
--       effect. word_counters and profiles had zero blocking policies.
--       Fix: drop all old INSERT/UPDATE policies and recreate them
--       with is_permanent_user() built into the condition.
--       Also: clean up any rows written by anonymous users during the
--       broken-policy window.
--   0b: Add learning_score column to mastery, epoch columns to
--       profiles, and updated_at trigger to mastery.
-- ─────────────────────────────────────────────


-- ════════════════════════════════════════════
-- PART 1: Fix anonymous write blocking RLS
-- ════════════════════════════════════════════

-- ── mastery ───────────────────────────────────

drop policy if exists "Users insert own mastery" on public.mastery;
drop policy if exists "Users update own mastery" on public.mastery;
drop policy if exists "Block anonymous mastery insert" on public.mastery;
drop policy if exists "Block anonymous mastery update" on public.mastery;

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


-- ── word_mastery ──────────────────────────────

drop policy if exists "Users insert own word mastery" on public.word_mastery;
drop policy if exists "Users update own word mastery" on public.word_mastery;
drop policy if exists "Block anonymous word_mastery insert" on public.word_mastery;
drop policy if exists "Block anonymous word_mastery update" on public.word_mastery;

create policy "Permanent users insert own word mastery"
  on public.word_mastery for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and public.is_permanent_user()
  );

create policy "Permanent users update own word mastery"
  on public.word_mastery for update
  to authenticated
  using (
    (select auth.uid()) = user_id
    and public.is_permanent_user()
  )
  with check (
    (select auth.uid()) = user_id
    and public.is_permanent_user()
  );


-- ── word_counters (had zero blocking policies) ─

drop policy if exists "Users insert own word counters" on public.word_counters;
drop policy if exists "Users update own word counters" on public.word_counters;

create policy "Permanent users insert own word counters"
  on public.word_counters for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and public.is_permanent_user()
  );

create policy "Permanent users update own word counters"
  on public.word_counters for update
  to authenticated
  using (
    (select auth.uid()) = user_id
    and public.is_permanent_user()
  )
  with check (
    (select auth.uid()) = user_id
    and public.is_permanent_user()
  );


-- ── manual_unlocks ────────────────────────────

drop policy if exists "Users insert own manual unlocks" on public.manual_unlocks;
drop policy if exists "Users update own manual unlocks" on public.manual_unlocks;
drop policy if exists "Block anonymous manual_unlocks insert" on public.manual_unlocks;

create policy "Permanent users insert own manual unlocks"
  on public.manual_unlocks for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and public.is_permanent_user()
  );

create policy "Permanent users update own manual unlocks"
  on public.manual_unlocks for update
  to authenticated
  using (
    (select auth.uid()) = user_id
    and public.is_permanent_user()
  )
  with check (
    (select auth.uid()) = user_id
    and public.is_permanent_user()
  );


-- ── word_manual_unlocks ───────────────────────

drop policy if exists "Users insert own word manual unlocks" on public.word_manual_unlocks;
drop policy if exists "Block anonymous word_manual_unlocks insert" on public.word_manual_unlocks;

create policy "Permanent users insert own word manual unlocks"
  on public.word_manual_unlocks for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and public.is_permanent_user()
  );

-- word_manual_unlocks has no UPDATE policy (write-once by design)


-- ── practice_sessions ─────────────────────────

drop policy if exists "Users insert own practice sessions" on public.practice_sessions;
drop policy if exists "Users update own practice sessions" on public.practice_sessions;
drop policy if exists "Block anonymous practice_sessions insert" on public.practice_sessions;
drop policy if exists "Block anonymous practice_sessions update" on public.practice_sessions;

create policy "Permanent users insert own practice sessions"
  on public.practice_sessions for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and public.is_permanent_user()
  );

create policy "Permanent users update own practice sessions"
  on public.practice_sessions for update
  to authenticated
  using (
    (select auth.uid()) = user_id
    and public.is_permanent_user()
  )
  with check (
    (select auth.uid()) = user_id
    and public.is_permanent_user()
  );


-- ── profiles (had zero blocking policies, uses id not user_id) ─

drop policy if exists "Users update own profile" on public.profiles;

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


-- ── Cleanup anonymous-owned rows ──────────────
-- Anonymous users should never have had rows in these tables.
-- Any that exist are from the broken permissive policy window.
-- Profiles are left in place (cascade-deleted when anon user expires).

do $$
declare
  v_mastery_count integer;
  v_word_mastery_count integer;
  v_word_counters_count integer;
  v_manual_unlocks_count integer;
  v_word_manual_unlocks_count integer;
  v_practice_sessions_count integer;
begin
  -- Dry-run counts for logging
  select count(*) into v_mastery_count
    from public.mastery m
    join auth.users u on u.id = m.user_id
    where u.raw_app_meta_data->>'provider' = 'anonymous';

  select count(*) into v_word_mastery_count
    from public.word_mastery wm
    join auth.users u on u.id = wm.user_id
    where u.raw_app_meta_data->>'provider' = 'anonymous';

  select count(*) into v_word_counters_count
    from public.word_counters wc
    join auth.users u on u.id = wc.user_id
    where u.raw_app_meta_data->>'provider' = 'anonymous';

  select count(*) into v_manual_unlocks_count
    from public.manual_unlocks mu
    join auth.users u on u.id = mu.user_id
    where u.raw_app_meta_data->>'provider' = 'anonymous';

  select count(*) into v_word_manual_unlocks_count
    from public.word_manual_unlocks wmu
    join auth.users u on u.id = wmu.user_id
    where u.raw_app_meta_data->>'provider' = 'anonymous';

  select count(*) into v_practice_sessions_count
    from public.practice_sessions ps
    join auth.users u on u.id = ps.user_id
    where u.raw_app_meta_data->>'provider' = 'anonymous';

  raise notice 'Anonymous row cleanup - mastery: %, word_mastery: %, word_counters: %, manual_unlocks: %, word_manual_unlocks: %, practice_sessions: %',
    v_mastery_count, v_word_mastery_count, v_word_counters_count,
    v_manual_unlocks_count, v_word_manual_unlocks_count, v_practice_sessions_count;

  -- Delete anonymous-owned rows
  delete from public.mastery
    where user_id in (
      select id from auth.users
      where raw_app_meta_data->>'provider' = 'anonymous'
    );

  delete from public.word_mastery
    where user_id in (
      select id from auth.users
      where raw_app_meta_data->>'provider' = 'anonymous'
    );

  delete from public.word_counters
    where user_id in (
      select id from auth.users
      where raw_app_meta_data->>'provider' = 'anonymous'
    );

  delete from public.manual_unlocks
    where user_id in (
      select id from auth.users
      where raw_app_meta_data->>'provider' = 'anonymous'
    );

  delete from public.word_manual_unlocks
    where user_id in (
      select id from auth.users
      where raw_app_meta_data->>'provider' = 'anonymous'
    );

  delete from public.practice_sessions
    where user_id in (
      select id from auth.users
      where raw_app_meta_data->>'provider' = 'anonymous'
    );
end $$;


-- ════════════════════════════════════════════
-- PART 2: Add learning_score, epochs, and trigger (Plan 0b)
-- ════════════════════════════════════════════

-- ── mastery: add learning_score ───────────────
-- Learning scores (0-5) unlock characters. Separate from mastery
-- scores which track word-practice proficiency.

alter table public.mastery
  add column learning_score integer not null default 0
  check (learning_score >= 0 and learning_score <= 5);

-- Backfill existing rows: learning score is capped at 5
update public.mastery
  set learning_score = least(score, 5);


-- ── profiles: add epoch columns ───────────────
-- Domain-level reset epochs. Incremented by reset RPCs.
-- Checkpoint sync RPCs require exact epoch match.

alter table public.profiles
  add column mastery_reset_epoch integer not null default 0;

alter table public.profiles
  add column word_mastery_reset_epoch integer not null default 0;


-- ── mastery: add updated_at trigger ───────────
-- Matches the existing word_mastery trigger pattern.

create or replace function public.set_mastery_updated_at()
returns trigger
language plpgsql
security definer set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger mastery_set_updated_at
  before update on public.mastery
  for each row execute procedure public.set_mastery_updated_at();
