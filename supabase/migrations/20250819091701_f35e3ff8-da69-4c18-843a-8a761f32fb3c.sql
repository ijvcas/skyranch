-- Security improvements for data access restrictions

-- 1. Tighten app_users table RLS policies
-- Current issue: All authenticated users can view all user data through admin policy
-- Fix: Ensure only actual admins (not just authenticated users) can view all users

-- Drop existing policies that are too permissive
DROP POLICY IF EXISTS "Admins can view all app_users" ON public.app_users;

-- Recreate with proper admin-only access
CREATE POLICY "Only admins can view all app_users" 
ON public.app_users 
FOR SELECT 
USING (get_current_app_role() = 'admin');

-- 2. Restrict support_settings access to admin users only
-- Current issue: All authenticated users can view support contact info
-- Fix: Only admins should see support settings

DROP POLICY IF EXISTS "Authenticated users can view support settings" ON public.support_settings;

CREATE POLICY "Only admins can view support settings" 
ON public.support_settings 
FOR SELECT 
USING (get_current_app_role() = 'admin');

-- 3. Limit app_version table access to admin users only
-- Current issue: All authenticated users can view version info
-- Fix: Only admins need to see version details

DROP POLICY IF EXISTS "Everyone can view current version" ON public.app_version;

CREATE POLICY "Only admins can view app versions" 
ON public.app_version 
FOR SELECT 
USING (get_current_app_role() = 'admin');

-- 4. Add data retention function for user_connection_logs
-- This will help with privacy compliance by automatically cleaning old logs

CREATE OR REPLACE FUNCTION public.cleanup_old_connection_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  -- Delete connection logs older than 90 days
  DELETE FROM public.user_connection_logs 
  WHERE created_at < (now() - interval '90 days');
END;
$function$;

-- 5. Enhanced audit logging function for admin operations
CREATE OR REPLACE FUNCTION public.log_admin_operation(
  operation_type text,
  table_name text,
  record_id uuid DEFAULT NULL,
  old_data jsonb DEFAULT NULL,
  new_data jsonb DEFAULT NULL,
  reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  -- Only log if user is admin
  IF get_current_app_role() = 'admin' THEN
    INSERT INTO public.user_role_audit (
      user_id,
      changed_by,
      old_role,
      new_role,
      reason,
      metadata
    ) VALUES (
      COALESCE(record_id, auth.uid()),
      auth.uid(),
      operation_type,
      table_name,
      reason,
      jsonb_build_object(
        'operation_type', operation_type,
        'table_name', table_name,
        'record_id', record_id,
        'old_data', old_data,
        'new_data', new_data,
        'timestamp', now(),
        'ip_address', 'server-side'
      )
    );
  END IF;
END;
$function$;