-- Fix farm storage RLS policies to match actual file structure
-- The previous policies assumed folder structure that doesn't exist

-- Drop the overly restrictive policies
DROP POLICY IF EXISTS "Farm owners can view their logos" ON storage.objects;
DROP POLICY IF EXISTS "Farm owners can upload their logos" ON storage.objects;
DROP POLICY IF EXISTS "Farm owners can update their logos" ON storage.objects;
DROP POLICY IF EXISTS "Farm owners can delete their logos" ON storage.objects;
DROP POLICY IF EXISTS "Farm owners can view their pictures" ON storage.objects;
DROP POLICY IF EXISTS "Farm owners can upload their pictures" ON storage.objects;
DROP POLICY IF EXISTS "Farm owners can update their pictures" ON storage.objects;
DROP POLICY IF EXISTS "Farm owners can delete their pictures" ON storage.objects;

-- Create new policies that check if user has a farm_profile
-- This matches the actual usage where files are stored without folder structure

CREATE POLICY "Authenticated users with farm can view logos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'farm-logos'
  AND EXISTS (
    SELECT 1 FROM public.farm_profiles 
    WHERE created_by = auth.uid()
  )
);

CREATE POLICY "Authenticated users with farm can upload logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'farm-logos'
  AND EXISTS (
    SELECT 1 FROM public.farm_profiles 
    WHERE created_by = auth.uid()
  )
);

CREATE POLICY "Authenticated users with farm can update logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'farm-logos'
  AND EXISTS (
    SELECT 1 FROM public.farm_profiles 
    WHERE created_by = auth.uid()
  )
);

CREATE POLICY "Authenticated users with farm can delete logos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'farm-logos'
  AND EXISTS (
    SELECT 1 FROM public.farm_profiles 
    WHERE created_by = auth.uid()
  )
);

-- Same policies for farm-pictures
CREATE POLICY "Authenticated users with farm can view pictures"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'farm-pictures'
  AND EXISTS (
    SELECT 1 FROM public.farm_profiles 
    WHERE created_by = auth.uid()
  )
);

CREATE POLICY "Authenticated users with farm can upload pictures"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'farm-pictures'
  AND EXISTS (
    SELECT 1 FROM public.farm_profiles 
    WHERE created_by = auth.uid()
  )
);

CREATE POLICY "Authenticated users with farm can update pictures"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'farm-pictures'
  AND EXISTS (
    SELECT 1 FROM public.farm_profiles 
    WHERE created_by = auth.uid()
  )
);

CREATE POLICY "Authenticated users with farm can delete pictures"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'farm-pictures'
  AND EXISTS (
    SELECT 1 FROM public.farm_profiles 
    WHERE created_by = auth.uid()
  )
);