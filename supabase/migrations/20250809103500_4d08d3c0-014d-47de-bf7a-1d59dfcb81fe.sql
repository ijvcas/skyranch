-- Fix user ID mismatch between auth.users and app_users tables
-- This migration will sync the correct auth user IDs to app_users table

-- Update existing app_users records to match auth.users IDs by email
UPDATE public.app_users 
SET id = auth_users.id
FROM (
  SELECT id, email 
  FROM auth.users 
  WHERE email IS NOT NULL
) AS auth_users
WHERE public.app_users.email = auth_users.email
  AND public.app_users.id != auth_users.id;

-- Insert any missing users from auth.users that don't exist in app_users
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
LEFT JOIN public.app_users apu ON au.id = apu.id
WHERE apu.id IS NULL
  AND au.email IS NOT NULL
  AND au.email_confirmed_at IS NOT NULL
ON CONFLICT (id) DO NOTHING;