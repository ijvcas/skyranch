-- 1) Function to fetch current user's app role securely
create or replace function public.get_current_app_role()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(role, 'worker')::text
  from public.app_users
  where id = auth.uid()
  limit 1
$$;

-- 2) Harden app_users policies: drop permissive policies and create strict ones
-- Drop existing permissive policies if they exist
drop policy if exists "All authenticated users can delete app users" on public.app_users;
drop policy if exists "All authenticated users can insert app users" on public.app_users;
drop policy if exists "All authenticated users can update app users" on public.app_users;
drop policy if exists "All authenticated users can view all app users" on public.app_users;
drop policy if exists "Authenticated users can create app users" on public.app_users;
drop policy if exists "Authenticated users can delete app users" on public.app_users;
drop policy if exists "Authenticated users can insert app users" on public.app_users;
drop policy if exists "Authenticated users can update app users" on public.app_users;
drop policy if exists "Authenticated users can view app users" on public.app_users;
drop policy if exists "Users can delete all app users" on public.app_users;
drop policy if exists "Users can update all app users" on public.app_users;
drop policy if exists "Users can view all app users" on public.app_users;

-- Create least-privilege policies
create policy "Users can view their own app_user"
  on public.app_users
  for select
  using (auth.uid() = id);

create policy "Admins can view all app_users"
  on public.app_users
  for select
  using (public.get_current_app_role() = 'admin');

create policy "Admins can insert app_users"
  on public.app_users
  for insert
  with check (public.get_current_app_role() = 'admin');

create policy "Admins can update app_users"
  on public.app_users
  for update
  using (public.get_current_app_role() = 'admin');

create policy "Admins can delete app_users"
  on public.app_users
  for delete
  using (public.get_current_app_role() = 'admin');

create policy "Users can update their own app_user"
  on public.app_users
  for update
  using (auth.uid() = id);

-- 3) Harden profiles: drop permissive policies that expose all profiles
drop policy if exists "All authenticated users can delete profiles" on public.profiles;
drop policy if exists "All authenticated users can insert profiles" on public.profiles;
drop policy if exists "All authenticated users can update profiles" on public.profiles;
drop policy if exists "All authenticated users can view all profiles" on public.profiles;
