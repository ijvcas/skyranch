-- Fix sync function to avoid duplicate email conflicts and include all users regardless of confirmation
CREATE OR REPLACE FUNCTION public.sync_auth_users_to_app_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  -- Insert missing users from auth.users into app_users
  -- Avoid duplicates by checking both missing id and missing email in app_users
  INSERT INTO public.app_users (id, name, email, role, is_active, created_by, phone)
  SELECT 
    au.id,
    COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)) as name,
    au.email,
    'worker' as role,
    true as is_active,
    au.id as created_by,
    COALESCE(au.raw_user_meta_data->>'phone', '') as phone
  FROM auth.users au
  LEFT JOIN public.app_users apu_id ON apu_id.id = au.id
  LEFT JOIN public.app_users apu_email ON apu_email.email = au.email
  WHERE apu_id.id IS NULL
    AND apu_email.email IS NULL
    AND au.email IS NOT NULL;
END;
$function$;

-- Run an immediate sync after updating function
SELECT public.sync_auth_users_to_app_users();