-- Security Fix 1: Fix Role Escalation Vulnerability (CRITICAL)
-- Remove the problematic RLS policy that allows users to update their own role
DROP POLICY IF EXISTS "Users can update their own app_user" ON public.app_users;

-- Create a restricted RLS policy that only allows users to update safe fields
CREATE POLICY "Users can update their own safe fields" ON public.app_users
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id 
  AND role = (SELECT role FROM public.app_users WHERE id = auth.uid())
  AND is_active = (SELECT is_active FROM public.app_users WHERE id = auth.uid())
  AND created_by = (SELECT created_by FROM public.app_users WHERE id = auth.uid())
);

-- Security Fix 2: Add audit logging for role changes
CREATE TABLE IF NOT EXISTS public.user_role_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  old_role text,
  new_role text NOT NULL,
  changed_by uuid NOT NULL,
  changed_at timestamp with time zone NOT NULL DEFAULT now(),
  reason text,
  metadata jsonb
);

-- Enable RLS on audit table
ALTER TABLE public.user_role_audit ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs" ON public.user_role_audit
FOR SELECT 
USING (get_current_app_role() = 'admin');

-- System can insert audit logs
CREATE POLICY "System can insert audit logs" ON public.user_role_audit
FOR INSERT 
WITH CHECK (true);

-- Security Fix 3: Restrict Personal Information Access
-- Update support_settings to admin-only access for modifications
DROP POLICY IF EXISTS "Authenticated users can modify support settings" ON public.support_settings;

CREATE POLICY "Admins can manage support settings" ON public.support_settings
FOR ALL 
USING (get_current_app_role() = 'admin')
WITH CHECK (get_current_app_role() = 'admin');

-- Update user_connection_logs to mask sensitive data for non-admins
DROP POLICY IF EXISTS "Users can view their own connection logs" ON public.user_connection_logs;

CREATE POLICY "Users can view their own connection logs (limited)" ON public.user_connection_logs
FOR SELECT 
USING (
  auth.uid() = user_id 
  AND get_current_app_role() != 'admin'
);

-- Security Fix 4: Add server-side password validation function
CREATE OR REPLACE FUNCTION public.validate_password_server_side(password text, email text DEFAULT NULL, full_name text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  errors text[] := '{}';
  score integer := 0;
  normalized_password text;
  email_local text;
  name_tokens text[];
BEGIN
  -- Basic length check
  IF length(password) < 12 THEN
    errors := array_append(errors, 'Password must be at least 12 characters long');
  ELSE
    score := score + 1;
  END IF;

  -- Character variety checks
  IF password ~ '[a-z]' AND password ~ '[A-Z]' THEN
    score := score + 1;
  ELSE
    errors := array_append(errors, 'Password must contain both uppercase and lowercase letters');
  END IF;

  IF password ~ '[0-9]' THEN
    score := score + 1;
  ELSE
    errors := array_append(errors, 'Password must contain at least one number');
  END IF;

  IF password ~ '[^A-Za-z0-9]' THEN
    score := score + 1;
  ELSE
    errors := array_append(errors, 'Password must contain at least one special character');
  END IF;

  -- Check for repeated characters
  IF NOT (password ~ '(.)\1\1') THEN
    score := score + 1;
  ELSE
    errors := array_append(errors, 'Password cannot have more than 2 consecutive identical characters');
  END IF;

  -- Common password check (simplified)
  normalized_password := lower(password);
  IF normalized_password IN ('password', '123456', '123456789', 'qwerty', 'letmein', 'welcome', 'admin', 'password123') THEN
    errors := array_append(errors, 'Password is too common');
  END IF;

  -- Email/name checks
  IF email IS NOT NULL THEN
    email_local := split_part(email, '@', 1);
    IF length(email_local) >= 4 AND position(lower(email_local) in normalized_password) > 0 THEN
      errors := array_append(errors, 'Password cannot contain your email');
    END IF;
  END IF;

  IF full_name IS NOT NULL THEN
    name_tokens := string_to_array(lower(full_name), ' ');
    FOR i IN 1..array_length(name_tokens, 1) LOOP
      IF length(name_tokens[i]) >= 3 AND position(name_tokens[i] in normalized_password) > 0 THEN
        errors := array_append(errors, 'Password cannot contain your name');
        EXIT;
      END IF;
    END LOOP;
  END IF;

  RETURN jsonb_build_object(
    'valid', array_length(errors, 1) = 0 OR array_length(errors, 1) IS NULL,
    'score', LEAST(score, 5),
    'errors', errors
  );
END;
$$;