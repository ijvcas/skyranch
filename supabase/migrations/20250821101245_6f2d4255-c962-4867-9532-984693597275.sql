-- Fix RLS policies for animals table to handle auth context issues
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view their own animals" ON animals;
DROP POLICY IF EXISTS "Users can view their own animals only" ON animals;

-- Create more robust RLS policies that handle auth context better
CREATE POLICY "Users can view their own animals" 
ON animals FOR SELECT 
TO authenticated
USING (
  auth.uid() = user_id OR 
  (auth.uid() IS NOT NULL AND user_id IN (
    SELECT id FROM app_users WHERE id = auth.uid() AND is_active = true
  ))
);

-- Also update other animal policies to be more robust
DROP POLICY IF EXISTS "Users can insert their own animals" ON animals;
CREATE POLICY "Users can insert their own animals" 
ON animals FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() = user_id OR 
  (auth.uid() IS NOT NULL AND user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can update their own animals" ON animals;
CREATE POLICY "Users can update their own animals" 
ON animals FOR UPDATE 
TO authenticated
USING (
  auth.uid() = user_id OR 
  (auth.uid() IS NOT NULL AND user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can delete their own animals" ON animals;  
CREATE POLICY "Users can delete their own animals" 
ON animals FOR DELETE 
TO authenticated
USING (
  auth.uid() = user_id OR 
  (auth.uid() IS NOT NULL AND user_id = auth.uid())
);