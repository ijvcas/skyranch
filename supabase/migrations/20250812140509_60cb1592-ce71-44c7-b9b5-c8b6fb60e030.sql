
-- 1) Table for connection logs
create table if not exists public.user_connection_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  event text not null,                  -- 'signed_in', 'signed_out', 'token_refreshed', 'app_open', etc.
  method text,                          -- 'password', 'oauth', 'magic_link', etc.
  path text,
  referrer text,
  user_agent text,
  ip_address text,
  device text,
  os text,
  browser text,
  success boolean not null default true,
  error_code text,
  error_message text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- 2) Enable RLS
alter table public.user_connection_logs enable row level security;

-- 3) RLS policies
-- Users can insert their own logs
create policy if not exists "Users can insert their own connection logs"
on public.user_connection_logs
for insert
to authenticated
with check (auth.uid() = user_id);

-- Users can view their own logs
create policy if not exists "Users can view their own connection logs"
on public.user_connection_logs
for select
to authenticated
using (auth.uid() = user_id);

-- Admins can view all logs
create policy if not exists "Admins can view all connection logs"
on public.user_connection_logs
for select
to authenticated
using (public.get_current_app_role() = 'admin');

-- Admins can delete logs (for maintenance)
create policy if not exists "Admins can delete connection logs"
on public.user_connection_logs
for delete
to authenticated
using (public.get_current_app_role() = 'admin');

-- 4) Indexes for performance
create index if not exists idx_user_connection_logs_user_created_at
  on public.user_connection_logs (user_id, created_at desc);

create index if not exists idx_user_connection_logs_event_created_at
  on public.user_connection_logs (event, created_at desc);

-- 5) Optional: simple retention helper (manual/cron via edge function)
create or replace function public.cleanup_old_user_connection_logs()
returns void
language plpgsql
security definer
set search_path to 'public','pg_temp'
as $$
begin
  delete from public.user_connection_logs
  where created_at < (now() - interval '180 days');
end;
$$;
