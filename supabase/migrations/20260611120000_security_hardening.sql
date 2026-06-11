-- ─────────────────────────────────────────────
-- Migration: 20260611120000_security_hardening.sql
-- Purpose: Security hardening from the 2026-06-11 leadership review.
--          1. submit_bug_report RPC: atomic rate gate + insert under a
--             per-user advisory lock, closing the check-then-insert race
--             in the bug-report route handler. Service-role only.
--          2. guard_username_change: fix NULL-comparison bypass that let
--             direct client UPDATEs change username without the RPC.
--          3. claim_initial_username RPC: legitimate first-time username
--             assignment during sign-up (the direct UPDATE the guard now
--             blocks). Does not start the rename cooldown.
--          4. leaderboard_sessions: make the implicit deny-all explicit
--             with a table comment (RLS + FORCE already enabled, zero
--             policies by design - all access is via RPCs).
-- Sprint: 17 - Security and Pre-Launch QA
-- ─────────────────────────────────────────────

-- ── 1. Atomic bug report submission ───────────

-- The route handler validates auth, MIME, size, and length caps, uploads
-- the screenshot, then calls this RPC as the authoritative rate gate.
-- The advisory transaction lock serializes concurrent submissions per
-- user, so two simultaneous requests can never both pass the 60s check.
create or replace function public.submit_bug_report(
  p_user_id uuid,
  p_type text,
  p_description text,
  p_screenshot_path text,
  p_user_agent text,
  p_app_state jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_last_report timestamptz;
  v_elapsed numeric;
  v_rate_limit_seconds constant numeric := 60;
  v_report_id uuid;
begin
  -- Serialize per user for the duration of this transaction.
  perform pg_advisory_xact_lock(hashtext('bug_report:' || p_user_id::text));

  -- Defense in depth: re-validate constraints the route already checks.
  if p_type is null or p_type not in ('bug', 'feature', 'other') then
    return jsonb_build_object('ok', false, 'error', 'invalid_type');
  end if;
  if p_description is null or char_length(p_description) = 0
     or char_length(p_description) > 2000 then
    return jsonb_build_object('ok', false, 'error', 'invalid_description');
  end if;

  select max(created_at) into v_last_report
  from public.bug_reports
  where user_id = p_user_id;

  if v_last_report is not null then
    v_elapsed := extract(epoch from (now() - v_last_report));
    if v_elapsed < v_rate_limit_seconds then
      return jsonb_build_object(
        'ok', false,
        'error', 'rate_limited',
        'retry_after', ceil(v_rate_limit_seconds - v_elapsed)
      );
    end if;
  end if;

  insert into public.bug_reports
    (user_id, type, description, screenshot_path, user_agent, app_state)
  values
    (p_user_id, p_type, p_description, p_screenshot_path, p_user_agent, p_app_state)
  returning id into v_report_id;

  return jsonb_build_object('ok', true, 'id', v_report_id);
end;
$$;

-- Service-role only: clients must never call this directly, because
-- p_user_id is caller-supplied (the route handler passes the verified
-- session user). Revoking execute keeps the function out of reach of
-- the anon and authenticated roles entirely.
revoke execute on function public.submit_bug_report(uuid, text, text, text, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.submit_bug_report(uuid, text, text, text, text, jsonb)
  to service_role;

-- ── 2. Fix guard_username_change NULL bypass ──

-- The original guard compared current_setting(..., true) != '1', but
-- current_setting returns NULL when the setting is unset, and NULL != '1'
-- evaluates to NULL (falsy). The exception therefore never fired and a
-- direct client UPDATE could change username/username_changed_at,
-- bypassing the 30-day cooldown. coalesce closes the hole.
create or replace function public.guard_username_change()
returns trigger
language plpgsql
security definer set search_path = public, pg_temp
as $$
begin
  if new.username is distinct from old.username
     or new.username_changed_at is distinct from old.username_changed_at then
    if coalesce(current_setting('app.allow_username_change', true), '') != '1' then
      raise exception 'Username changes must use the change_username RPC'
        using errcode = 'P0001';
    end if;
  end if;
  return new;
end;
$$;

-- ── 3. claim_initial_username RPC ─────────────

-- Sign-up sets the user's chosen username right after the handle_new_user
-- trigger creates the profile with a generated default. That write was a
-- direct client UPDATE, which only worked because of the guard bug fixed
-- above. This RPC is the legitimate first-time path: it validates like
-- change_username but does NOT set username_changed_at (the 30-day
-- cooldown starts on the first RENAME, not on claiming the initial name),
-- and it only works while the profile still has its generated default.
create or replace function public.claim_initial_username(p_username text)
returns jsonb
language plpgsql
security definer set search_path = public, pg_temp
as $$
declare
  v_user_id uuid;
  v_trimmed text;
  v_current text;
  v_changed_at timestamptz;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    return jsonb_build_object('ok', false, 'error_code', 'unauthorized');
  end if;

  v_trimmed := trim(p_username);
  if v_trimmed is null or length(v_trimmed) < 3 or length(v_trimmed) > 20
     or v_trimmed !~ '^[a-zA-Z0-9_]+$' then
    return jsonb_build_object('ok', false, 'error_code', 'invalid_format');
  end if;

  select username, username_changed_at into v_current, v_changed_at
  from public.profiles
  where id = v_user_id
  for update;

  if v_current is null then
    return jsonb_build_object('ok', false, 'error_code', 'profile_missing');
  end if;

  -- Only the untouched generated default may be claimed over.
  if v_changed_at is not null
     or v_current != ('user_' || left(v_user_id::text, 8)) then
    return jsonb_build_object('ok', false, 'error_code', 'already_claimed');
  end if;

  if exists (
    select 1 from public.profiles
    where lower(username) = lower(v_trimmed) and id != v_user_id
  ) then
    return jsonb_build_object('ok', false, 'error_code', 'username_taken');
  end if;

  perform set_config('app.allow_username_change', '1', true);
  update public.profiles set username = v_trimmed where id = v_user_id;

  return jsonb_build_object('ok', true);
end;
$$;

revoke execute on function public.claim_initial_username(text) from public, anon;
grant execute on function public.claim_initial_username(text) to authenticated, service_role;

-- ── 4. leaderboard_sessions explicit deny ─────

comment on table public.leaderboard_sessions is
  'Deny-all by design: RLS + FORCE enabled with zero policies. All reads '
  'and writes go through the server-derived scoring RPCs '
  '(start_leaderboard_session / finalize_leaderboard_session). Do not add '
  'client-facing policies to this table.';
