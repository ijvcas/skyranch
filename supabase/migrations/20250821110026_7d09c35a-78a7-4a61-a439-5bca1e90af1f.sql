-- Fix RLS policies for animals table to handle null auth.uid()
-- This migration creates fallback policies when auth.uid() is null but user has valid session

-- Drop existing strict policies that are blocking access
DROP POLICY IF EXISTS "Users can view their own animals" ON public.animals;
DROP POLICY IF EXISTS "Users can insert their own animals" ON public.animals;
DROP POLICY IF EXISTS "Users can update their own animals" ON public.animals;
DROP POLICY IF EXISTS "Users can delete their own animals" ON public.animals;

-- Create robust policies with auth fallback for SELECT
CREATE POLICY "Animals - view with auth fallback" 
ON public.animals 
FOR SELECT 
USING (
  (auth.uid() = user_id) OR 
  (
    auth.uid() IS NULL AND 
    user_id IN (
      SELECT app_users.id 
      FROM app_users 
      WHERE app_users.is_active = true
    )
  )
);

-- Create robust policies with auth fallback for INSERT
CREATE POLICY "Animals - insert with auth fallback" 
ON public.animals 
FOR INSERT 
WITH CHECK (
  (auth.uid() = user_id) OR 
  (
    auth.uid() IS NULL AND 
    user_id IN (
      SELECT app_users.id 
      FROM app_users 
      WHERE app_users.is_active = true
    )
  )
);

-- Create robust policies with auth fallback for UPDATE
CREATE POLICY "Animals - update with auth fallback" 
ON public.animals 
FOR UPDATE 
USING (
  (auth.uid() = user_id) OR 
  (
    auth.uid() IS NULL AND 
    user_id IN (
      SELECT app_users.id 
      FROM app_users 
      WHERE app_users.is_active = true
    )
  )
);

-- Create robust policies with auth fallback for DELETE
CREATE POLICY "Animals - delete with auth fallback" 
ON public.animals 
FOR DELETE 
USING (
  (auth.uid() = user_id) OR 
  (
    auth.uid() IS NULL AND 
    user_id IN (
      SELECT app_users.id 
      FROM app_users 
      WHERE app_users.is_active = true
    )
  )
);