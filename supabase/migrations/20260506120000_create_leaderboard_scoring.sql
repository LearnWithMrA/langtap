-- ---------------------------------------------------------
-- Migration: 20260506120000_create_leaderboard_scoring.sql
-- Purpose: Server-scored leaderboard with per-completion events.
--          Replaces the old one-row-per-user leaderboard concept.
--          Adds leaderboard_visibility to profiles.
--          Two tables: leaderboard_scores (aggregate) and
--          leaderboard_score_events (idempotency + audit).
--          Two RPCs: record_leaderboard_completion (write) and
--          get_leaderboard (read). No client writes. No public
--          SELECT on raw tables.
-- Old leaderboard table: left in place, not dropped.
-- ---------------------------------------------------------


-- ── profiles.leaderboard_visibility ─────────

alter table public.profiles
  add column leaderboard_visibility text not null default 'public'
  check (leaderboard_visibility in ('public', 'hidden'));


-- ── leaderboard_scores (aggregate) ──────────
-- One row per (user_id, game_type, input_mode).
-- Maximum 6 rows per user.

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

create index leaderboard_scores_alltime_idx
  on public.leaderboard_scores (game_type, input_mode, total_score desc);

create index leaderboard_scores_weekly_idx
  on public.leaderboard_scores (game_type, input_mode, week_start, week_score desc);

create index leaderboard_scores_user_idx
  on public.leaderboard_scores (user_id);

alter table public.leaderboard_scores enable row level security;
alter table public.leaderboard_scores force row level security;

-- No SELECT, INSERT, UPDATE, or DELETE policies.
-- All access goes through security-definer RPCs below.


-- ── leaderboard_score_events (idempotency) ──
-- One row per completion event. Prevents double-counting on retry.

create table public.leaderboard_score_events (
  event_id      uuid primary key,
  user_id       uuid not null references auth.users(id) on delete cascade,
  game_type     text not null check (game_type in ('kana', 'kotoba')),
  input_mode    text not null check (input_mode in ('tap', 'type', 'swipe')),
  score_delta   integer not null check (score_delta > 0),
  created_at    timestamptz not null default now()
);

create index leaderboard_events_user_idx
  on public.leaderboard_score_events (user_id, created_at desc);

alter table public.leaderboard_score_events enable row level security;
alter table public.leaderboard_score_events force row level security;

-- No policies. All access through RPCs.


-- ── updated_at trigger ──────────────────────

create or replace function public.set_leaderboard_scores_updated_at()
returns trigger
language plpgsql
security definer set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger leaderboard_scores_set_updated_at
  before update on public.leaderboard_scores
  for each row execute procedure public.set_leaderboard_scores_updated_at();


-- ── RPC: record_leaderboard_completion ──────
-- Called per word/character completion from the game window.
-- Accepts a bounded score delta, not a client total.
-- Idempotent via event_id. Rate-limited per user.

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
declare
  v_user_id uuid := auth.uid();
  v_is_anon boolean;
  v_visibility text;
  v_current_week date := (date_trunc('week', now() at time zone 'UTC'))::date;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Reject anonymous users (guests)
  select raw_app_meta_data->>'provider' = 'anonymous'
    into v_is_anon
    from auth.users
    where id = v_user_id;

  if v_is_anon is true then
    raise exception 'Anonymous users cannot score on leaderboard';
  end if;

  if p_game_type not in ('kana', 'kotoba') then
    raise exception 'Invalid game_type';
  end if;
  if p_input_mode not in ('tap', 'type', 'swipe') then
    raise exception 'Invalid input_mode';
  end if;
  if p_score_delta <= 0 or p_score_delta > 20 then
    raise exception 'Invalid score_delta';
  end if;

  -- Idempotency: skip if event already recorded
  if exists (
    select 1 from public.leaderboard_score_events where event_id = p_event_id
  ) then
    return;
  end if;

  -- Rate limit: max 120 events per user per hour
  if (
    select count(*) from public.leaderboard_score_events
    where user_id = v_user_id and created_at > now() - interval '1 hour'
  ) >= 120 then
    raise exception 'Rate limit exceeded';
  end if;

  -- Skip write if user is hidden
  select leaderboard_visibility into v_visibility
    from public.profiles where id = v_user_id;
  if v_visibility = 'hidden' then
    return;
  end if;

  -- Record the event
  insert into public.leaderboard_score_events
    (event_id, user_id, game_type, input_mode, score_delta)
  values
    (p_event_id, v_user_id, p_game_type, p_input_mode, p_score_delta);

  -- Upsert the aggregate score
  insert into public.leaderboard_scores
    (user_id, game_type, input_mode, total_score, week_score, week_start)
  values
    (v_user_id, p_game_type, p_input_mode, p_score_delta, p_score_delta, v_current_week)
  on conflict (user_id, game_type, input_mode) do update set
    total_score = public.leaderboard_scores.total_score + p_score_delta,
    week_score = case
      when public.leaderboard_scores.week_start < v_current_week
        then p_score_delta
      else public.leaderboard_scores.week_score + p_score_delta
    end,
    week_start = v_current_week;
end;
$$;


-- ── RPC: get_leaderboard ────────────────────
-- Public read surface. Filters out hidden users.
-- Returns ranked rows + current user's row if outside top N.

create or replace function public.get_leaderboard(
  p_game_type text,
  p_input_mode text,
  p_period text,
  p_limit integer default 50
) returns table (
  rank bigint,
  username text,
  score integer,
  is_current_user boolean
)
language sql
security definer
stable
set search_path = ''
as $$
  with visible_entries as (
    select
      ls.user_id,
      p.username,
      case when p_period = 'this-week'
        then case when ls.week_start >= (date_trunc('week', now() at time zone 'UTC'))::date
          then ls.week_score else 0 end
        else ls.total_score
      end as effective_score
    from public.leaderboard_scores ls
    join public.profiles p on p.id = ls.user_id
    where ls.game_type = p_game_type
      and ls.input_mode = p_input_mode
      and p.leaderboard_visibility = 'public'
  ),
  ranked as (
    select
      row_number() over (
        order by ve.effective_score desc, ve.user_id asc
      ) as rank,
      ve.username,
      ve.effective_score as score,
      (ve.user_id = auth.uid()) as is_current_user
    from visible_entries ve
    where ve.effective_score > 0
  )
  select r.rank, r.username, r.score, r.is_current_user
  from ranked r
  where r.rank <= p_limit or r.is_current_user
  order by r.rank;
$$;
