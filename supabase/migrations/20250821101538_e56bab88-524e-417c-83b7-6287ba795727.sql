-- Create a more robust function to get user data that works without auth context
CREATE OR REPLACE FUNCTION public.get_user_by_email(user_email text)
RETURNS TABLE(id uuid, role text, is_active boolean)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path TO 'public'
AS $$
  SELECT au.id, au.role, au.is_active
  FROM public.app_users au
  WHERE au.email = user_email
  AND au.is_active = true
  LIMIT 1;
$$;

-- Create alternative RLS policies that can work with email when auth.uid() fails
CREATE POLICY "Users can view animals by email fallback" 
ON animals FOR SELECT 
TO authenticated
USING (
  -- First try normal auth context
  auth.uid() = user_id OR 
  -- Fallback: if auth context broken, allow if user exists in app_users with same email
  (
    auth.uid() IS NULL AND 
    user_id IN (
      SELECT au.id 
      FROM app_users au 
      INNER JOIN auth.users aut ON aut.id = au.id
      WHERE aut.email = auth.email()
      AND au.is_active = true
    )
  )
);

-- Update insert policy with email fallback
DROP POLICY IF EXISTS "Users can insert their own animals" ON animals;
CREATE POLICY "Users can insert their own animals with fallback" 
ON animals FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() = user_id OR 
  (
    auth.uid() IS NULL AND
    user_id IN (
      SELECT au.id 
      FROM app_users au 
      INNER JOIN auth.users aut ON aut.id = au.id
      WHERE aut.email = auth.email()
      AND au.is_active = true
    )
  )
);

-- Update other policies similarly
DROP POLICY IF EXISTS "Users can update their own animals" ON animals;
CREATE POLICY "Users can update animals with fallback" 
ON animals FOR UPDATE 
TO authenticated
USING (
  auth.uid() = user_id OR 
  (
    auth.uid() IS NULL AND
    user_id IN (
      SELECT au.id 
      FROM app_users au 
      INNER JOIN auth.users aut ON aut.id = au.id
      WHERE aut.email = auth.email()
      AND au.is_active = true
    )
  )
);

DROP POLICY IF EXISTS "Users can delete their own animals" ON animals;
CREATE POLICY "Users can delete animals with fallback" 
ON animals FOR DELETE 
TO authenticated
USING (
  auth.uid() = user_id OR 
  (
    auth.uid() IS NULL AND
    user_id IN (
      SELECT au.id 
      FROM app_users au 
      INNER JOIN auth.users aut ON aut.id = au.id
      WHERE aut.email = auth.email()
      AND au.is_active = true
    )
  )
);