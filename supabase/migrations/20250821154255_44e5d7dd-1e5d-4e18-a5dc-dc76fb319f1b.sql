-- Fix cadastral_parcels RLS policies to enable full CRUD operations
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Authenticated users can view cadastral parcels" ON public.cadastral_parcels;
DROP POLICY IF EXISTS "Farm users can view all cadastral parcels" ON public.cadastral_parcels;

-- Create comprehensive RLS policies for cadastral_parcels (shared data)
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