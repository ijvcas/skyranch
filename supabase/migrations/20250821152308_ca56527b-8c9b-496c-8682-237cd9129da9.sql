-- Fix circular dependency in app_users RLS policies
-- The issue is that get_current_app_role() needs to read from app_users,
-- but app_users RLS policies use get_current_app_role(), creating a circular dependency

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view only their own profile data" ON public.app_users;

-- Create a new policy that allows users to read their own records directly
-- without depending on get_current_app_role()
CREATE POLICY "Users can view their own profile" 
ON public.app_users 
FOR SELECT 
USING (auth.uid() = id);

-- Keep the admin policy for full access
-- (This should already exist, but ensuring it's there)
DROP POLICY IF EXISTS "Admins can view all app_users" ON public.app_users;
CREATE POLICY "Admins can view all app_users" 
ON public.app_users 
FOR SELECT 
USING (get_current_app_role() = 'admin');