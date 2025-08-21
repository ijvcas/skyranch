-- Fix RLS policies for cadastral data sharing
-- All authenticated active users should be able to see all properties and cadastral parcels

-- Update properties table policies
DROP POLICY IF EXISTS "Users can view their own properties" ON public.properties;
DROP POLICY IF EXISTS "Users can insert their own properties" ON public.properties;
DROP POLICY IF EXISTS "Users can update their own properties" ON public.properties;
DROP POLICY IF EXISTS "Users can delete their own properties" ON public.properties;

CREATE POLICY "Active users can view all properties"
ON public.properties
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.app_users 
    WHERE id = auth.uid() 
    AND is_active = true
  )
);

CREATE POLICY "Active users can insert properties"
ON public.properties
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

CREATE POLICY "Active users can update all properties"
ON public.properties
FOR UPDATE
USING (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.app_users 
    WHERE id = auth.uid() 
    AND is_active = true
  )
);

CREATE POLICY "Active users can delete all properties"
ON public.properties
FOR DELETE
USING (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.app_users 
    WHERE id = auth.uid() 
    AND is_active = true
  )
);

-- Update cadastral_parcels table policies
DROP POLICY IF EXISTS "Users can view their own cadastral parcels" ON public.cadastral_parcels;
DROP POLICY IF EXISTS "Users can insert their own cadastral parcels" ON public.cadastral_parcels;
DROP POLICY IF EXISTS "Users can update their own cadastral parcels" ON public.cadastral_parcels;
DROP POLICY IF EXISTS "Users can delete their own cadastral parcels" ON public.cadastral_parcels;

CREATE POLICY "Active users can view all cadastral parcels"
ON public.cadastral_parcels
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.app_users 
    WHERE id = auth.uid() 
    AND is_active = true
  )
);

CREATE POLICY "Active users can insert cadastral parcels"
ON public.cadastral_parcels
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.app_users 
    WHERE id = auth.uid() 
    AND is_active = true
  )
);

CREATE POLICY "Active users can update all cadastral parcels"
ON public.cadastral_parcels
FOR UPDATE
USING (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.app_users 
    WHERE id = auth.uid() 
    AND is_active = true
  )
);

CREATE POLICY "Active users can delete all cadastral parcels"
ON public.cadastral_parcels
FOR DELETE
USING (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.app_users 
    WHERE id = auth.uid() 
    AND is_active = true
  )
);