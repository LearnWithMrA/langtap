-- ─────────────────────────────────────────────
-- File: supabase/cleanup-guest-usage.sql
-- Purpose: Daily cleanup of expired anonymous guest data.
--          Run as a scheduled job (Supabase cron or pg_cron).
--          Deletes guest_usage rows past their 3-day expiry,
--          then deletes orphaned anonymous auth users.
--          Cascading FK on guest_usage handles row deletion
--          when the auth user is removed.
--
-- Schedule: daily at 03:00 UTC
-- Command:  select cron.schedule('cleanup-guest-usage', '0 3 * * *', $$
--             select public.cleanup_expired_guests();
--           $$);
-- ─────────────────────────────────────────────

create or replace function public.cleanup_expired_guests()
returns void
language plpgsql
security definer set search_path = public, pg_temp
as $$
begin
  -- Delete expired guest usage rows (3-day TTL)
  delete from public.guest_usage
    where expires_at < now();

  -- Delete anonymous auth users with no guest_usage row
  -- (orphaned after the above delete, or never created a row)
  delete from auth.users
    where raw_app_meta_data->>'provider' = 'anonymous'
      and id not in (select user_id from public.guest_usage)
      and created_at < now() - interval '3 days';
end;
$$;
