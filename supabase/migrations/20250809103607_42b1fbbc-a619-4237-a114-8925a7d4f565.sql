-- Safely add missing auth users to app_users without updating existing records
-- This avoids foreign key constraint violations

INSERT INTO public.app_users (id, name, email, role, is_active, created_by, phone)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)) as name,
  au.email,
  'manager' as role,
  true as is_active,
  au.id as created_by,
  COALESCE(au.raw_user_meta_data->>'phone', '') as phone
FROM auth.users au
WHERE au.email IS NOT NULL
  AND au.email_confirmed_at IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.app_users apu 
    WHERE apu.id = au.id OR apu.email = au.email
  );