-- Fix RLS policies for multi-user data sharing
-- All authenticated active users should be able to see all animals

-- Drop the existing complex RLS policy for animals
DROP POLICY IF EXISTS "Users can view their own animals" ON public.animals;

-- Create new policy that allows all active app users to see all animals
CREATE POLICY "Active users can view all animals"
ON public.animals
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.app_users 
    WHERE id = auth.uid() 
    AND is_active = true
  )
);

-- Update insert/update/delete policies to also allow all active users
DROP POLICY IF EXISTS "Users can insert their own animals" ON public.animals;
DROP POLICY IF EXISTS "Users can update their own animals" ON public.animals;
DROP POLICY IF EXISTS "Users can delete their own animals" ON public.animals;

CREATE POLICY "Active users can insert animals"
ON public.animals
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.app_users 
    WHERE id = auth.uid() 
    AND is_active = true
  )
  AND user_id = auth.uid()
);

CREATE POLICY "Active users can update all animals"
ON public.animals
FOR UPDATE
USING (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.app_users 
    WHERE id = auth.uid() 
    AND is_active = true
  )
);

CREATE POLICY "Active users can delete all animals"
ON public.animals
FOR DELETE
USING (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.app_users 
    WHERE id = auth.uid() 
    AND is_active = true
  )
);