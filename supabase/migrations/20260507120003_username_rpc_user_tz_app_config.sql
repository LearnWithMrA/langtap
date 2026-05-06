-- ---------------------------------------------------------
-- Migration: 20260507120003_username_rpc_user_tz_app_config.sql
-- Purpose: Sprint 10 Phase 0e + 0f combined.
--   0e: Username change RPC with server-enforced 30-day cooldown,
--       case-insensitive uniqueness index, and trigger guard.
--   0f: Add user_tz and import tracking columns to profiles.
--       Create app_config table for server-owned feature flags.
--       Create skip_guest_import and skip_legacy_import RPCs.
-- ---------------------------------------------------------


-- ══════════════════════════════════════════════
-- PART 1: Username change RPC (Plan 0e)
-- ══════════════════════════════════════════════

-- Case-insensitive uniqueness index
create unique index if not exists profiles_username_lower_idx
  on public.profiles (lower(username));

-- Trigger to block direct username changes via client UPDATE
create or replace function public.guard_username_change()
returns trigger
language plpgsql
security definer set search_path = public, pg_temp
as $$
begin
  if new.username is distinct from old.username
     or new.username_changed_at is distinct from old.username_changed_at then
    if current_setting('app.allow_username_change', true) != '1' then
      raise exception 'Username changes must use the change_username RPC'
        using errcode = 'P0001';
    end if;
  end if;
  return new;
end;
$$;

create trigger profiles_guard_username_change
  before update on public.profiles
  for each row execute procedure public.guard_username_change();

-- Username change RPC
create or replace function public.change_username(p_new_username text)
returns jsonb
language plpgsql
security definer set search_path = public, pg_temp
as $$
declare
  v_user_id uuid;
  v_current_changed_at timestamptz;
  v_trimmed text;
  v_next_allowed timestamptz;
begin
  v_user_id := auth.uid();

  if not is_permanent_user() then
    return jsonb_build_object(
      'ok', false,
      'error_code', 'unauthorized'
    );
  end if;

  select username_changed_at into v_current_changed_at
    from profiles where id = v_user_id for update;
  if not found then
    raise exception 'Profile not found' using errcode = 'P0002';
  end if;

  -- Normalize
  v_trimmed := btrim(p_new_username);

  -- Validate format: 3-20 chars, alphanumeric + underscore
  if length(v_trimmed) < 3 or length(v_trimmed) > 20 then
    return jsonb_build_object(
      'ok', false,
      'error_code', 'invalid_format'
    );
  end if;

  if v_trimmed !~ '^[a-zA-Z0-9_]+$' then
    return jsonb_build_object(
      'ok', false,
      'error_code', 'invalid_format'
    );
  end if;

  -- 30-day cooldown
  if v_current_changed_at is not null
     and now() < v_current_changed_at + interval '30 days' then
    v_next_allowed := v_current_changed_at + interval '30 days';
    return jsonb_build_object(
      'ok', false,
      'error_code', 'cooldown_active',
      'next_allowed_at', v_next_allowed
    );
  end if;

  -- Case-insensitive uniqueness (the index enforces this, but
  -- checking here gives a better error message than a constraint violation)
  if exists (
    select 1 from profiles
    where lower(username) = lower(v_trimmed)
      and id != v_user_id
  ) then
    return jsonb_build_object(
      'ok', false,
      'error_code', 'username_taken'
    );
  end if;

  -- Apply via set_config so the trigger allows this UPDATE
  perform set_config('app.allow_username_change', '1', true);

  update profiles
    set username = v_trimmed,
        username_changed_at = now()
    where id = v_user_id;

  return jsonb_build_object('ok', true);
end;
$$;

revoke execute on function public.change_username from public;
grant execute on function public.change_username to authenticated;


-- ══════════════════════════════════════════════
-- PART 2: Profile columns (Plan 0f)
-- ══════════════════════════════════════════════

-- User timezone for daily cap date bucketing
alter table public.profiles
  add column if not exists user_tz text not null default 'UTC';

-- Guest import tracking (current-session guest conversion)
alter table public.profiles
  add column if not exists guest_imported_at timestamptz;

alter table public.profiles
  add column if not exists guest_import_skipped_at timestamptz;

-- Legacy import tracking (old global localStorage keys)
alter table public.profiles
  add column if not exists legacy_imported_at timestamptz;

alter table public.profiles
  add column if not exists legacy_import_skipped_at timestamptz;


-- ══════════════════════════════════════════════
-- PART 3: app_config table (Plan 0f)
-- ══════════════════════════════════════════════

create table public.app_config (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.app_config enable row level security;
alter table public.app_config force row level security;

create policy "Authenticated users can read config"
  on public.app_config for select
  to authenticated
  using (true);

-- Seed initial config
insert into public.app_config (key, value)
  values ('daily_cap_enabled', 'false'::jsonb);


-- ══════════════════════════════════════════════
-- PART 4: Skip import RPCs (Plan 0f)
-- ══════════════════════════════════════════════

create or replace function public.skip_guest_import()
returns jsonb
language plpgsql
security definer set search_path = public, pg_temp
as $$
declare
  v_user_id uuid;
begin
  v_user_id := auth.uid();

  if not is_permanent_user() then
    raise exception 'Anonymous users cannot skip import'
      using errcode = 'P0001';
  end if;

  select 1 from profiles where id = v_user_id for update;
  if not found then
    raise exception 'Profile not found' using errcode = 'P0002';
  end if;

  update profiles
    set guest_import_skipped_at = now()
    where id = v_user_id;

  return jsonb_build_object('ok', true);
end;
$$;

revoke execute on function public.skip_guest_import from public;
grant execute on function public.skip_guest_import to authenticated;


create or replace function public.skip_legacy_import()
returns jsonb
language plpgsql
security definer set search_path = public, pg_temp
as $$
declare
  v_user_id uuid;
begin
  v_user_id := auth.uid();

  if not is_permanent_user() then
    raise exception 'Anonymous users cannot skip import'
      using errcode = 'P0001';
  end if;

  select 1 from profiles where id = v_user_id for update;
  if not found then
    raise exception 'Profile not found' using errcode = 'P0002';
  end if;

  update profiles
    set legacy_import_skipped_at = now()
    where id = v_user_id;

  return jsonb_build_object('ok', true);
end;
$$;

revoke execute on function public.skip_legacy_import from public;
grant execute on function public.skip_legacy_import to authenticated;
