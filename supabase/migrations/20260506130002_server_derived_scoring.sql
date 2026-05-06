-- ---------------------------------------------------------
-- Migration: 20260506130002_server_derived_scoring.sql
-- Purpose: Server-derived leaderboard scoring. Replaces client-
--          provided score deltas with server-verified attempt
--          validation. Two new RPCs: start_leaderboard_session
--          and finalize_leaderboard_session. Old RPC retired.
-- ---------------------------------------------------------


-- ── leaderboard_sessions ───────────────────

create table public.leaderboard_sessions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  word_id         text not null references public.leaderboard_word_catalog(word_id),
  game_type       text not null check (game_type in ('kana', 'kotoba')),
  input_mode      text not null check (input_mode in ('tap', 'type', 'swipe')),
  kotoba_input    text check (kotoba_input in ('readings', 'kanji')),
  char_count      smallint not null,
  expected_romaji jsonb not null,
  expected_kana   jsonb not null,
  expected_kanji  text,
  status          text not null default 'active' check (status in ('active', 'finalized', 'expired')),
  score           smallint,
  created_at      timestamptz not null default now(),
  expires_at      timestamptz not null default now() + interval '5 minutes'
);

create index leaderboard_sessions_user_active_idx
  on public.leaderboard_sessions (user_id, status, created_at desc);

create index leaderboard_sessions_cleanup_idx
  on public.leaderboard_sessions (status, expires_at)
  where status = 'active';

alter table public.leaderboard_sessions enable row level security;
alter table public.leaderboard_sessions force row level security;


-- ── Add audit columns to score_events ──────

alter table public.leaderboard_score_events
  add column word_id text,
  add column attempts jsonb;


-- ── RPC: start_leaderboard_session ─────────

create or replace function public.start_leaderboard_session(
  p_game_type    text,
  p_input_mode   text,
  p_word_id      text,
  p_kotoba_input text default null
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id    uuid := auth.uid();
  v_is_anon    boolean;
  v_visibility text;
  v_catalog    record;
  v_session_id uuid;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select raw_app_meta_data->>'provider' = 'anonymous'
    into v_is_anon
    from auth.users where id = v_user_id;
  if v_is_anon is true then
    raise exception 'Anonymous users cannot start leaderboard sessions';
  end if;

  select leaderboard_visibility into v_visibility
    from public.profiles where id = v_user_id;
  if v_visibility = 'hidden' then
    return null;
  end if;

  if p_game_type not in ('kana', 'kotoba') then
    raise exception 'Invalid game_type';
  end if;
  if p_input_mode not in ('tap', 'type', 'swipe') then
    raise exception 'Invalid input_mode';
  end if;

  if p_game_type = 'kana' and p_kotoba_input is not null then
    raise exception 'kotoba_input must be null for kana';
  end if;
  if p_game_type = 'kotoba' and p_kotoba_input not in ('readings', 'kanji') then
    raise exception 'Invalid kotoba_input';
  end if;

  select word_id, char_count, has_kanji, expected_romaji, expected_kana, kanji
    into v_catalog
    from public.leaderboard_word_catalog
    where word_id = p_word_id;
  if not found then
    raise exception 'Unknown word_id';
  end if;

  if p_kotoba_input = 'kanji' and v_catalog.has_kanji = false then
    raise exception 'Word has no kanji for kanji mode';
  end if;

  if (
    select count(*) from public.leaderboard_sessions
    where user_id = v_user_id and created_at > now() - interval '1 hour'
  ) >= 120 then
    raise exception 'Rate limit exceeded';
  end if;

  insert into public.leaderboard_sessions
    (user_id, word_id, game_type, input_mode, kotoba_input,
     char_count, expected_romaji, expected_kana, expected_kanji)
  values
    (v_user_id, p_word_id, p_game_type, p_input_mode, p_kotoba_input,
     v_catalog.char_count, v_catalog.expected_romaji, v_catalog.expected_kana, v_catalog.kanji)
  returning id into v_session_id;

  return v_session_id;
end;
$$;


-- ── RPC: finalize_leaderboard_session ──────

create or replace function public.finalize_leaderboard_session(
  p_session_id uuid,
  p_attempts   jsonb
) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id      uuid := auth.uid();
  v_session      record;
  v_current_week date := (date_trunc('week', now() at time zone 'UTC'))::date;
  v_score        integer := 0;
  v_visibility   text;
  v_char_attempts integer;
  v_kanji_attempts integer;
  v_all_correct  boolean;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Atomic claim
  update public.leaderboard_sessions
    set status = case
      when expires_at < now() then 'expired'
      else 'finalized'
    end
    where id = p_session_id
      and user_id = v_user_id
      and status = 'active'
    returning * into v_session;

  if not found then
    return;
  end if;

  if v_session.status = 'expired' then
    update public.leaderboard_sessions set score = 0 where id = p_session_id;
    return;
  end if;

  -- ── Validate attempts structure ──────────
  if p_attempts is null or jsonb_typeof(p_attempts) != 'array' then
    update public.leaderboard_sessions set score = 0 where id = p_session_id;
    return;
  end if;

  if jsonb_array_length(p_attempts) < 1
     or jsonb_array_length(p_attempts) > v_session.char_count + 1 then
    update public.leaderboard_sessions set score = 0 where id = p_session_id;
    return;
  end if;

  -- Validate every element shape before any casting
  if exists (
    select 1 from jsonb_array_elements(p_attempts) a
    where jsonb_typeof(a) != 'object'
       or not (a ? 'charIndex')
       or not (a ? 'submitted')
       or jsonb_typeof(a->'charIndex') != 'number'
       or jsonb_typeof(a->'submitted') != 'string'
       or (a->>'charIndex')::numeric != trunc((a->>'charIndex')::numeric)
       or (a->>'charIndex')::numeric < -1
       or (a->>'charIndex')::numeric > 999
  ) then
    update public.leaderboard_sessions set score = 0 where id = p_session_id;
    return;
  end if;

  -- Check for duplicate indices
  if exists (
    select (a->>'charIndex')::int from jsonb_array_elements(p_attempts) a
    group by (a->>'charIndex')::int having count(*) > 1
  ) then
    update public.leaderboard_sessions set score = 0 where id = p_session_id;
    return;
  end if;

  -- ── Kana scoring ─────────────────────────
  if v_session.game_type = 'kana' then
    -- Require exact coverage: char_count attempts, indices [0..char_count)
    if jsonb_array_length(p_attempts) != v_session.char_count then
      update public.leaderboard_sessions set score = 0 where id = p_session_id;
      return;
    end if;

    if exists (
      select 1 from jsonb_array_elements(p_attempts) a
      where (a->>'charIndex')::int < 0
         or (a->>'charIndex')::int >= v_session.char_count
    ) then
      update public.leaderboard_sessions set score = 0 where id = p_session_id;
      return;
    end if;

    -- Score = positions where submitted matches expected romaji or kana
    v_score := (
      with attempts as (
        select
          (a->>'charIndex')::int as idx,
          a->>'submitted' as submitted
        from jsonb_array_elements(p_attempts) a
      )
      select count(*) from attempts a
      where a.submitted = (v_session.expected_romaji->>a.idx)
         or a.submitted = (v_session.expected_kana->>a.idx)
    );

  -- ── Kotoba scoring ───────────────────────
  elsif v_session.game_type = 'kotoba' then
    -- Count character vs kanji attempts
    v_char_attempts := (
      select count(*) from jsonb_array_elements(p_attempts) a
      where (a->>'charIndex')::int >= 0
    );
    v_kanji_attempts := (
      select count(*) from jsonb_array_elements(p_attempts) a
      where (a->>'charIndex')::int = -1
    );

    -- Readings mode: require exact character coverage, no kanji attempt
    -- Kanji mode: character attempts optional (tap sends them, type/swipe may not).
    --             If present, must be exactly char_count and match expected.
    --             Kanji attempt required.
    if v_session.kotoba_input = 'readings' then
      if v_char_attempts != v_session.char_count then
        update public.leaderboard_sessions set score = 0 where id = p_session_id;
        return;
      end if;
      if v_kanji_attempts != 0 then
        update public.leaderboard_sessions set score = 0 where id = p_session_id;
        return;
      end if;
    elsif v_session.kotoba_input = 'kanji' then
      if v_char_attempts != 0 and v_char_attempts != v_session.char_count then
        update public.leaderboard_sessions set score = 0 where id = p_session_id;
        return;
      end if;
      if v_kanji_attempts != 1 then
        update public.leaderboard_sessions set score = 0 where id = p_session_id;
        return;
      end if;
    end if;

    -- Validate character indices in range (if any present)
    if v_char_attempts > 0 and exists (
      select 1 from jsonb_array_elements(p_attempts) a
      where (a->>'charIndex')::int >= 0
        and ((a->>'charIndex')::int < 0 or (a->>'charIndex')::int >= v_session.char_count)
    ) then
      update public.leaderboard_sessions set score = 0 where id = p_session_id;
      return;
    end if;

    -- Check all character attempts match expected romaji or kana (if any present)
    v_all_correct := not exists (
      with char_attempts as (
        select
          (a->>'charIndex')::int as idx,
          a->>'submitted' as submitted
        from jsonb_array_elements(p_attempts) a
        where (a->>'charIndex')::int >= 0
      )
      select 1 from char_attempts ca
      where ca.submitted != (v_session.expected_romaji->>ca.idx)
        and ca.submitted != (v_session.expected_kana->>ca.idx)
    );

    -- Check kanji attempt if applicable
    if v_session.kotoba_input = 'kanji' and v_all_correct then
      v_all_correct := (
        select a->>'submitted' = v_session.expected_kanji
        from jsonb_array_elements(p_attempts) a
        where (a->>'charIndex')::int = -1
        limit 1
      );
    end if;

    if v_all_correct then
      v_score := case when v_session.kotoba_input = 'kanji' then 4 else 1 end;
    else
      v_score := 0;
    end if;
  end if;

  -- Record score on session
  update public.leaderboard_sessions set score = v_score where id = p_session_id;

  if v_score <= 0 then
    return;
  end if;

  select leaderboard_visibility into v_visibility
    from public.profiles where id = v_user_id;
  if v_visibility = 'hidden' then
    return;
  end if;

  -- Record score event with audit trail
  insert into public.leaderboard_score_events
    (event_id, user_id, game_type, input_mode, score_delta, word_id, attempts)
  values
    (p_session_id, v_user_id, v_session.game_type, v_session.input_mode,
     v_score, v_session.word_id, p_attempts);

  -- Upsert aggregate
  insert into public.leaderboard_scores
    (user_id, game_type, input_mode, total_score, week_score, week_start)
  values
    (v_user_id, v_session.game_type, v_session.input_mode, v_score, v_score, v_current_week)
  on conflict (user_id, game_type, input_mode) do update set
    total_score = public.leaderboard_scores.total_score + v_score,
    week_score = case
      when public.leaderboard_scores.week_start < v_current_week
        then v_score
      else public.leaderboard_scores.week_score + v_score
    end,
    week_start = v_current_week;
end;
$$;


-- ── Retire old RPC ─────────────────────────

create or replace function public.record_leaderboard_completion(
  p_event_id uuid,
  p_game_type text,
  p_input_mode text,
  p_score_delta integer
) returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception 'This RPC has been retired. Use start/finalize_leaderboard_session.';
end;
$$;
