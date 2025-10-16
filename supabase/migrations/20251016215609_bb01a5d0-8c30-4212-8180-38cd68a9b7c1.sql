-- Create storage policies for animal-documents bucket

-- Allow users to upload documents for their own animals
CREATE POLICY "Users can upload documents for their animals"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'animal-documents'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM animals WHERE user_id = auth.uid()
  )
);

-- Allow users to view documents for their own animals
CREATE POLICY "Users can view documents for their animals"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'animal-documents'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM animals WHERE user_id = auth.uid()
  )
);

-- Allow users to delete documents for their own animals
CREATE POLICY "Users can delete documents for their animals"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'animal-documents'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM animals WHERE user_id = auth.uid()
  )
);