-- ─────────────────────────────────────────────
-- Migration: 20260611120001_membership_schema.sql
-- Purpose: Membership tier schema, pulled forward from Sprint 19 so a
--          tier can be assigned manually (e.g. owner lifetime) before
--          Stripe ships. Adds membership columns to profiles and a
--          write guard trigger: clients can read their own membership
--          (needed for UI) but can never change it. All membership
--          writes happen server-side (future Stripe webhook, or the
--          owner via SQL with the bypass setting).
--          Note: stripe_customer_id is readable on the user's OWN row
--          only (existing RLS). It is an opaque, non-secret identifier;
--          write protection is what matters and is enforced here.
-- Sprint: 19 - Payments (schema pulled forward 2026-06-11)
-- ─────────────────────────────────────────────

-- ── Columns ───────────────────────────────────

alter table public.profiles
  add column membership_tier text not null default 'free'
    check (membership_tier in ('free', 'monthly', 'annual', 'lifetime')),
  add column membership_expires_at timestamptz,
  add column stripe_customer_id text unique;

-- ── Write guard ───────────────────────────────

-- Same pattern as guard_username_change: clients update their own
-- profile row for settings, so a trigger (not RLS) must stop them from
-- granting themselves a paid tier. Server-side writers set the bypass
-- inside the same transaction.
create or replace function public.guard_membership_change()
returns trigger
language plpgsql
security definer set search_path = public, pg_temp
as $$
begin
  if new.membership_tier is distinct from old.membership_tier
     or new.membership_expires_at is distinct from old.membership_expires_at
     or new.stripe_customer_id is distinct from old.stripe_customer_id then
    -- coalesce is load-bearing: current_setting returns NULL when the
    -- setting is unset, and NULL != '1' is NULL (falsy), which would
    -- silently allow the update.
    if coalesce(current_setting('app.allow_membership_change', true), '') != '1' then
      raise exception 'Membership changes are server-side only'
        using errcode = 'P0001';
    end if;
  end if;
  return new;
end;
$$;

create trigger profiles_guard_membership_change
  before update on public.profiles
  for each row execute procedure public.guard_membership_change();

-- ── Membership status helper ──────────────────

-- True when the user currently has paid (uncapped) membership.
-- Lifetime never expires; monthly/annual require a future expiry.
create or replace function public.is_active_member(p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = p_user_id
      and (
        membership_tier = 'lifetime'
        or (
          membership_tier in ('monthly', 'annual')
          and membership_expires_at is not null
          and membership_expires_at > now()
        )
      )
  );
$$;

-- Server-side only: clients read membership from their own profile row.
-- Exposing this to authenticated would leak other users' member status.
revoke execute on function public.is_active_member(uuid) from public, anon, authenticated;
grant execute on function public.is_active_member(uuid) to service_role;

-- ── Membership assignment helper ──────────────

-- The single legitimate write path for membership: sets the guard bypass
-- and the columns in one transaction. Used by the owner (dashboard SQL
-- editor) and by the future Stripe webhook handler. Service-role only.
create or replace function public.admin_set_membership(
  p_user_id uuid,
  p_tier text,
  p_expires_at timestamptz default null,
  p_stripe_customer_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_tier is null or p_tier not in ('free', 'monthly', 'annual', 'lifetime') then
    return jsonb_build_object('ok', false, 'error', 'invalid_tier');
  end if;

  perform set_config('app.allow_membership_change', '1', true);

  update public.profiles
  set membership_tier = p_tier,
      membership_expires_at = p_expires_at,
      stripe_customer_id = coalesce(p_stripe_customer_id, stripe_customer_id)
  where id = p_user_id;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'profile_not_found');
  end if;

  return jsonb_build_object('ok', true, 'tier', p_tier);
end;
$$;

revoke execute on function public.admin_set_membership(uuid, text, timestamptz, text)
  from public, anon, authenticated;
grant execute on function public.admin_set_membership(uuid, text, timestamptz, text)
  to service_role;
