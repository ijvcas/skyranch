-- Add user ownership to properties table and secure RLS policies
-- First, add a user_id column to track property ownership
ALTER TABLE public.properties 
ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Set existing properties to be owned by the first admin user (or make them public if needed)
-- For now, we'll make them owned by the system/first admin
UPDATE public.properties 
SET user_id = (
  SELECT id FROM public.app_users 
  WHERE role = 'admin' 
  ORDER BY created_at ASC 
  LIMIT 1
)
WHERE user_id IS NULL;

-- Make user_id NOT NULL to enforce ownership
ALTER TABLE public.properties 
ALTER COLUMN user_id SET NOT NULL;

-- Drop the existing overly permissive RLS policy
DROP POLICY IF EXISTS "Authenticated users can view properties" ON public.properties;

-- Create secure RLS policies that restrict access to property owners and admins
CREATE POLICY "Users can view their own properties" 
ON public.properties 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all properties" 
ON public.properties 
FOR SELECT 
USING (get_current_app_role() = 'admin');

CREATE POLICY "Users can create their own properties" 
ON public.properties 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can create properties" 
ON public.properties 
FOR INSERT 
WITH CHECK (get_current_app_role() = 'admin');

-- Keep existing admin-only update/delete policies but add user ownership
DROP POLICY IF EXISTS "Admins can update properties" ON public.properties;
DROP POLICY IF EXISTS "Admins can delete properties" ON public.properties;

CREATE POLICY "Property owners can update their properties" 
ON public.properties 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update any properties" 
ON public.properties 
FOR UPDATE 
USING (get_current_app_role() = 'admin')
WITH CHECK (get_current_app_role() = 'admin');

CREATE POLICY "Property owners can delete their properties" 
ON public.properties 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete any properties" 
ON public.properties 
FOR DELETE 
USING (get_current_app_role() = 'admin');