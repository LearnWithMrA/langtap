-- ─────────────────────────────────────────────
-- Migration: 20260504120000_create_guest_usage.sql
-- Purpose: Server-side guest trial cap. Tracks cumulative practice
--          distance for anonymous (guest) users. All writes go
--          through RPCs, not direct table access. The 30m combined
--          cap is enforced server-side. Anonymous guest data expires
--          after 3 days of inactivity.
-- Tables: guest_usage
-- Functions: get_or_create_guest_usage, increment_guest_usage
-- ─────────────────────────────────────────────


-- ── guest_usage table ───────────────────────

create table if not exists public.guest_usage (
  user_id          uuid primary key references auth.users(id) on delete cascade,
  kana_distance    integer not null default 0 check (kana_distance >= 0),
  kotoba_distance  integer not null default 0 check (kotoba_distance >= 0),
  capped_at        timestamptz null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  expires_at       timestamptz not null default now() + interval '3 days'
);

alter table public.guest_usage enable row level security;
alter table public.guest_usage force row level security;

-- Guests can read their own usage row only
create policy "Guests read own usage"
  on public.guest_usage for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- No direct INSERT/UPDATE/DELETE policies for clients.
-- All writes go through RPCs with security definer.


-- ── updated_at trigger ──────────────────────

create or replace function public.set_guest_usage_updated_at()
returns trigger
language plpgsql
security definer set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  new.expires_at = now() + interval '3 days';
  return new;
end;
$$;

create trigger guest_usage_set_updated_at
  before update on public.guest_usage
  for each row execute procedure public.set_guest_usage_updated_at();


-- ── RPC: get_or_create_guest_usage ──────────
-- Returns the current guest's usage row, creating it if it doesn't exist.
-- Only works for anonymous users.

create or replace function public.get_or_create_guest_usage()
returns table (
  kana_distance integer,
  kotoba_distance integer,
  capped_at timestamptz
)
language plpgsql
security definer set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_is_anon boolean;
begin
  select raw_app_meta_data->>'provider' = 'anonymous'
    into v_is_anon
    from auth.users
    where id = v_user_id;

  if v_is_anon is not true then
    raise exception 'Only anonymous users can access guest usage';
  end if;

  insert into public.guest_usage (user_id)
    values (v_user_id)
    on conflict (user_id) do nothing;

  return query
    select g.kana_distance, g.kotoba_distance, g.capped_at
    from public.guest_usage g
    where g.user_id = v_user_id;
end;
$$;


-- ── RPC: increment_guest_usage ──────────────
-- Increments distance for a specific game type. Enforces the 30m
-- combined cap server-side. Sets capped_at when cap is reached.
-- Returns the updated row.

create or replace function public.increment_guest_usage(
  p_game_type text,
  p_metres integer
)
returns table (
  kana_distance integer,
  kotoba_distance integer,
  capped_at timestamptz
)
language plpgsql
security definer set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_is_anon boolean;
  v_cap constant integer := 30;
  v_current_kana integer;
  v_current_kotoba integer;
  v_current_total integer;
  v_increment integer;
begin
  if p_game_type not in ('kana', 'kotoba') then
    raise exception 'Invalid game type: %', p_game_type;
  end if;

  if p_metres is null or p_metres <= 0 then
    return query
      select g.kana_distance, g.kotoba_distance, g.capped_at
      from public.guest_usage g
      where g.user_id = v_user_id;
    return;
  end if;

  select raw_app_meta_data->>'provider' = 'anonymous'
    into v_is_anon
    from auth.users
    where id = v_user_id;

  if v_is_anon is not true then
    raise exception 'Only anonymous users can access guest usage';
  end if;

  -- Ensure row exists
  insert into public.guest_usage (user_id)
    values (v_user_id)
    on conflict (user_id) do nothing;

  -- Read current values
  select g.kana_distance, g.kotoba_distance
    into v_current_kana, v_current_kotoba
    from public.guest_usage g
    where g.user_id = v_user_id
    for update;

  v_current_total := v_current_kana + v_current_kotoba;

  -- Already capped
  if v_current_total >= v_cap then
    return query
      select g.kana_distance, g.kotoba_distance, g.capped_at
      from public.guest_usage g
      where g.user_id = v_user_id;
    return;
  end if;

  -- Clamp increment so combined total never exceeds cap
  v_increment := least(p_metres, v_cap - v_current_total);

  if p_game_type = 'kana' then
    update public.guest_usage
      set kana_distance = kana_distance + v_increment,
          capped_at = case
            when (kana_distance + v_increment + kotoba_distance) >= v_cap then now()
            else capped_at
          end
      where user_id = v_user_id;
  else
    update public.guest_usage
      set kotoba_distance = kotoba_distance + v_increment,
          capped_at = case
            when (kana_distance + kotoba_distance + v_increment) >= v_cap then now()
            else capped_at
          end
      where user_id = v_user_id;
  end if;

  return query
    select g.kana_distance, g.kotoba_distance, g.capped_at
    from public.guest_usage g
    where g.user_id = v_user_id;
end;
$$;


-- ── Restrictive policies for anonymous users on account tables ──
-- Anonymous users must not write to permanent account tables.
-- Existing policies use `to authenticated` which includes anonymous.
-- Add deny policies to block anonymous writes.

-- Helper: check if current user is anonymous
create or replace function public.is_permanent_user()
returns boolean
language sql
security definer set search_path = public, pg_temp
stable
as $$
  select coalesce(
    (select raw_app_meta_data->>'provider' != 'anonymous'
     from auth.users
     where id = auth.uid()),
    false
  );
$$;

-- Block anonymous INSERT on mastery
create policy "Block anonymous mastery insert"
  on public.mastery for insert
  to authenticated
  with check (public.is_permanent_user());

-- Block anonymous UPDATE on mastery
create policy "Block anonymous mastery update"
  on public.mastery for update
  to authenticated
  using (public.is_permanent_user());

-- Block anonymous INSERT on word_mastery
create policy "Block anonymous word_mastery insert"
  on public.word_mastery for insert
  to authenticated
  with check (public.is_permanent_user());

-- Block anonymous UPDATE on word_mastery
create policy "Block anonymous word_mastery update"
  on public.word_mastery for update
  to authenticated
  using (public.is_permanent_user());

-- Block anonymous INSERT on manual_unlocks (if exists)
do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'manual_unlocks' and table_schema = 'public') then
    execute 'create policy "Block anonymous manual_unlocks insert" on public.manual_unlocks for insert to authenticated with check (public.is_permanent_user())';
  end if;
end $$;

-- Block anonymous INSERT on word_manual_unlocks
create policy "Block anonymous word_manual_unlocks insert"
  on public.word_manual_unlocks for insert
  to authenticated
  with check (public.is_permanent_user());

-- Block anonymous INSERT on practice_sessions
create policy "Block anonymous practice_sessions insert"
  on public.practice_sessions for insert
  to authenticated
  with check (public.is_permanent_user());

-- Block anonymous UPDATE on practice_sessions
create policy "Block anonymous practice_sessions update"
  on public.practice_sessions for update
  to authenticated
  using (public.is_permanent_user());
