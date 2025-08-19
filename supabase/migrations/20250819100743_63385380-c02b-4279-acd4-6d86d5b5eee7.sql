-- Enable leaked password protection in auth configuration
-- Note: This requires manual action in Supabase Auth settings

-- Add password strength validation function
CREATE OR REPLACE FUNCTION public.validate_strong_password(password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Check minimum length
  IF length(password) < 12 THEN
    RETURN false;
  END IF;
  
  -- Check for uppercase, lowercase, numbers, and special characters
  IF NOT (password ~ '[a-z]' AND password ~ '[A-Z]' AND password ~ '[0-9]' AND password ~ '[^A-Za-z0-9]') THEN
    RETURN false;
  END IF;
  
  -- Check for no repeated characters
  IF password ~ '(.)\1\1' THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$function$;

-- Add comprehensive health check function
CREATE OR REPLACE FUNCTION public.system_health_check()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb := '{}'::jsonb;
  user_count integer;
  animal_count integer;
  auth_user_id uuid := auth.uid();
BEGIN
  -- Only allow admins or authenticated users to run health checks
  IF auth_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Unauthorized');
  END IF;
  
  -- Get basic counts
  SELECT COUNT(*) INTO user_count FROM public.app_users WHERE is_active = true;
  
  IF get_current_app_role() = 'admin' THEN
    SELECT COUNT(*) INTO animal_count FROM public.animals WHERE lifecycle_status != 'deceased';
  ELSE
    SELECT COUNT(*) INTO animal_count FROM public.animals 
    WHERE user_id = auth_user_id AND lifecycle_status != 'deceased';
  END IF;
  
  result := jsonb_build_object(
    'status', 'healthy',
    'timestamp', now(),
    'user_count', user_count,
    'animal_count', animal_count,
    'current_user_role', get_current_app_role()
  );
  
  RETURN result;
END;
$function$;