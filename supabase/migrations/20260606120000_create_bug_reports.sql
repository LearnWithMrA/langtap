-- ─────────────────────────────────────────────
-- Migration: 20260606120000_create_bug_reports.sql
-- Purpose: Create bug_reports table and bug-reports storage bucket.
--          RLS enabled with no client-facing policies. All writes go
--          through the route handler using service role.
--          Storage: private bucket, no client upload policies.
-- Sprint: 15 - Bug Reporting
-- ─────────────────────────────────────────────

-- ── Table ─────────────────────────────────────

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

alter table public.bug_reports enable row level security;
alter table public.bug_reports force row level security;

-- ── RLS policies ──────────────────────────────

-- No client-facing INSERT, SELECT, UPDATE, or DELETE policies.
-- All writes go through the route handler using the service role key,
-- which bypasses RLS. With RLS enabled and no policies, the table is
-- completely inaccessible to the client (anon key). This prevents
-- bypassing the rate gate and validation in the route handler.
-- Reports are read by the owner via service role key only.

-- ── Storage bucket ────────────────────────────

-- Private bucket with server-enforced MIME and size constraints.
-- No client-facing storage policies. Uploads go through the route
-- handler using the service role key, which bypasses storage policies.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'bug-reports',
  'bug-reports',
  false,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp']
);
