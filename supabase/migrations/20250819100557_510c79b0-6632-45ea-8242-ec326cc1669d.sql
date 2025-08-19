-- Fix critical security vulnerabilities in RLS policies

-- 1. Fix app_users table - Remove overly permissive policy and restrict to admin-only access
DROP POLICY IF EXISTS "Only admins can view all app_users" ON public.app_users;
DROP POLICY IF EXISTS "Users can view their own app_user" ON public.app_users;

-- Create new restricted policies for app_users
CREATE POLICY "Admins can view all app_users" 
ON public.app_users 
FOR SELECT 
USING (get_current_app_role() = 'admin');

CREATE POLICY "Users can view only their own profile data" 
ON public.app_users 
FOR SELECT 
USING (auth.uid() = id AND get_current_app_role() IN ('admin', 'worker'));

-- 2. Fix support_settings table - Make it admin-only
DROP POLICY IF EXISTS "Admins can manage support settings" ON public.support_settings;
DROP POLICY IF EXISTS "Only admins can view support settings" ON public.support_settings;

CREATE POLICY "Admin-only access to support settings" 
ON public.support_settings 
FOR ALL 
USING (get_current_app_role() = 'admin')
WITH CHECK (get_current_app_role() = 'admin');

-- 3. Fix user_connection_logs - Restrict to admins and own logs only
DROP POLICY IF EXISTS "Admins can view all connection logs" ON public.user_connection_logs;
DROP POLICY IF EXISTS "Users can view their own connection logs (limited)" ON public.user_connection_logs;

CREATE POLICY "Admins can view all connection logs" 
ON public.user_connection_logs 
FOR SELECT 
USING (get_current_app_role() = 'admin');

CREATE POLICY "Users can view only their own connection logs" 
ON public.user_connection_logs 
FOR SELECT 
USING (auth.uid() = user_id AND get_current_app_role() IN ('admin', 'worker'));

-- 4. Ensure animals table has proper RLS
DROP POLICY IF EXISTS "Active users can view animals" ON public.animals;

CREATE POLICY "Users can view their own animals only" 
ON public.animals 
FOR SELECT 
USING (auth.uid() = user_id AND is_active_user());

-- 5. Add query performance function for debugging
CREATE OR REPLACE FUNCTION public.get_animals_lean_with_timeout()
RETURNS TABLE(id uuid, species text, user_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_user_id uuid := auth.uid();
BEGIN
  -- Return basic animal count and species info for current user only
  RETURN QUERY
  SELECT 
    a.id,
    a.species,
    COUNT(*) OVER() as user_count
  FROM public.animals a
  WHERE a.user_id = current_user_id 
    AND a.lifecycle_status != 'deceased'
  ORDER BY a.created_at DESC
  LIMIT 100;
END;
$function$;