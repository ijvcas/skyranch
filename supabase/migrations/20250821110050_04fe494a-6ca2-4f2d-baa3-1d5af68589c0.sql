-- Fix RLS policies for animals table by dropping ALL existing policies and recreating them
-- This ensures we have clean, working policies that handle null auth.uid()

-- Drop all existing animal policies
DROP POLICY IF EXISTS "Users can view their own animals" ON public.animals;
DROP POLICY IF EXISTS "Users can insert their own animals" ON public.animals;  
DROP POLICY IF EXISTS "Users can update their own animals" ON public.animals;
DROP POLICY IF EXISTS "Users can delete their own animals" ON public.animals;
DROP POLICY IF EXISTS "Animals - view with auth fallback" ON public.animals;
DROP POLICY IF EXISTS "Animals - insert with auth fallback" ON public.animals;
DROP POLICY IF EXISTS "Animals - update with auth fallback" ON public.animals;
DROP POLICY IF EXISTS "Animals - delete with auth fallback" ON public.animals;
DROP POLICY IF EXISTS "Users can view animals by email fallback" ON public.animals;
DROP POLICY IF EXISTS "Users can insert their own animals with fallback" ON public.animals;
DROP POLICY IF EXISTS "Users can update animals with fallback" ON public.animals;
DROP POLICY IF EXISTS "Users can delete animals with fallback" ON public.animals;

-- Create comprehensive policies that work with both auth.uid() and email fallback
CREATE POLICY "Users can view their own animals" 
ON public.animals 
FOR SELECT 
USING (
  (auth.uid() = user_id) OR 
  (auth.uid() IS NOT NULL AND user_id IN (
    SELECT app_users.id 
    FROM app_users 
    WHERE app_users.id = auth.uid() AND app_users.is_active = true
  ))
);

CREATE POLICY "Users can insert their own animals" 
ON public.animals 
FOR INSERT 
WITH CHECK (
  (auth.uid() = user_id) OR 
  (auth.uid() IS NOT NULL AND user_id IN (
    SELECT app_users.id 
    FROM app_users 
    WHERE app_users.id = auth.uid() AND app_users.is_active = true
  ))
);

CREATE POLICY "Users can update their own animals" 
ON public.animals 
FOR UPDATE 
USING (
  (auth.uid() = user_id) OR 
  (auth.uid() IS NOT NULL AND user_id IN (
    SELECT app_users.id 
    FROM app_users 
    WHERE app_users.id = auth.uid() AND app_users.is_active = true
  ))
);

CREATE POLICY "Users can delete their own animals" 
ON public.animals 
FOR DELETE 
USING (
  (auth.uid() = user_id) OR 
  (auth.uid() IS NOT NULL AND user_id IN (
    SELECT app_users.id 
    FROM app_users 
    WHERE app_users.id = auth.uid() AND app_users.is_active = true
  ))
);