-- Fix STORAGE_EXPOSURE: Secure farm storage buckets with ownership-based access control

-- Step 1: Make farm-logos and farm-pictures buckets private
UPDATE storage.buckets 
SET public = false 
WHERE name IN ('farm-logos', 'farm-pictures');

-- Step 2: Drop existing overly permissive policies
DROP POLICY IF EXISTS "Farm logos are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Farm pictures are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload farm logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload farm pictures" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update farm logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update farm pictures" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete farm logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete farm pictures" ON storage.objects;

-- Step 3: Create secure ownership-based policies for farm-logos

CREATE POLICY "Users can view their own farm logos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'farm-logos'
  AND (storage.foldername(name))[1]::uuid IN (
    SELECT id FROM public.farm_profiles WHERE created_by = auth.uid()
  )
);

CREATE POLICY "Users can upload their own farm logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'farm-logos'
  AND (storage.foldername(name))[1]::uuid IN (
    SELECT id FROM public.farm_profiles WHERE created_by = auth.uid()
  )
);

CREATE POLICY "Users can update their own farm logos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'farm-logos'
  AND (storage.foldername(name))[1]::uuid IN (
    SELECT id FROM public.farm_profiles WHERE created_by = auth.uid()
  )
);

CREATE POLICY "Users can delete their own farm logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'farm-logos'
  AND (storage.foldername(name))[1]::uuid IN (
    SELECT id FROM public.farm_profiles WHERE created_by = auth.uid()
  )
);

-- Step 4: Create secure ownership-based policies for farm-pictures

CREATE POLICY "Users can view their own farm pictures"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'farm-pictures'
  AND (storage.foldername(name))[1]::uuid IN (
    SELECT id FROM public.farm_profiles WHERE created_by = auth.uid()
  )
);

CREATE POLICY "Users can upload their own farm pictures"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'farm-pictures'
  AND (storage.foldername(name))[1]::uuid IN (
    SELECT id FROM public.farm_profiles WHERE created_by = auth.uid()
  )
);

CREATE POLICY "Users can update their own farm pictures"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'farm-pictures'
  AND (storage.foldername(name))[1]::uuid IN (
    SELECT id FROM public.farm_profiles WHERE created_by = auth.uid()
  )
);

CREATE POLICY "Users can delete their own farm pictures"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'farm-pictures'
  AND (storage.foldername(name))[1]::uuid IN (
    SELECT id FROM public.farm_profiles WHERE created_by = auth.uid()
  )
);