-- First drop all existing animal policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own animals" ON animals;
DROP POLICY IF EXISTS "Users can view animals by email fallback" ON animals;
DROP POLICY IF EXISTS "Users can insert their own animals with fallback" ON animals;
DROP POLICY IF EXISTS "Users can update animals with fallback" ON animals;
DROP POLICY IF EXISTS "Users can delete animals with fallback" ON animals;

-- Create a function to get user data by email (fallback when auth.uid() is null)
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

-- Create robust RLS policies that work even when auth.uid() returns null
CREATE POLICY "Animals - users can view their own" 
ON animals FOR SELECT 
TO authenticated
USING (
  -- Normal case: auth context works
  (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
  -- Fallback: when auth.uid() is null but user is authenticated via JWT
  (auth.uid() IS NULL AND user_id IN (
    SELECT au.id 
    FROM app_users au 
    INNER JOIN auth.users aut ON aut.id = au.id
    WHERE aut.email = (
      SELECT email FROM auth.users WHERE id = ANY(
        SELECT (jwt_claim->'sub')::uuid 
        FROM (SELECT current_setting('request.jwt.claims', true)::jsonb AS jwt_claim) AS claims
        WHERE jwt_claim IS NOT NULL
      )
    )
    AND au.is_active = true
  ))
);

CREATE POLICY "Animals - users can insert their own" 
ON animals FOR INSERT 
TO authenticated
WITH CHECK (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
  (auth.uid() IS NULL AND user_id IN (
    SELECT au.id 
    FROM app_users au 
    INNER JOIN auth.users aut ON aut.id = au.id
    WHERE aut.email = (
      SELECT email FROM auth.users WHERE id = ANY(
        SELECT (jwt_claim->'sub')::uuid 
        FROM (SELECT current_setting('request.jwt.claims', true)::jsonb AS jwt_claim) AS claims
        WHERE jwt_claim IS NOT NULL
      )
    )
    AND au.is_active = true
  ))
);

CREATE POLICY "Animals - users can update their own" 
ON animals FOR UPDATE 
TO authenticated
USING (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
  (auth.uid() IS NULL AND user_id IN (
    SELECT au.id 
    FROM app_users au 
    INNER JOIN auth.users aut ON aut.id = au.id
    WHERE aut.email = (
      SELECT email FROM auth.users WHERE id = ANY(
        SELECT (jwt_claim->'sub')::uuid 
        FROM (SELECT current_setting('request.jwt.claims', true)::jsonb AS jwt_claim) AS claims
        WHERE jwt_claim IS NOT NULL
      )
    )
    AND au.is_active = true
  ))
);

CREATE POLICY "Animals - users can delete their own" 
ON animals FOR DELETE 
TO authenticated
USING (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
  (auth.uid() IS NULL AND user_id IN (
    SELECT au.id 
    FROM app_users au 
    INNER JOIN auth.users aut ON aut.id = au.id
    WHERE aut.email = (
      SELECT email FROM auth.users WHERE id = ANY(
        SELECT (jwt_claim->'sub')::uuid 
        FROM (SELECT current_setting('request.jwt.claims', true)::jsonb AS jwt_claim) AS claims
        WHERE jwt_claim IS NOT NULL
      )
    )
    AND au.is_active = true
  ))
);