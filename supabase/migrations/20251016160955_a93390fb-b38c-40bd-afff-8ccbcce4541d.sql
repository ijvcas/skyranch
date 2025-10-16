-- Create storage bucket for animal documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('animal-documents', 'animal-documents', false)
ON CONFLICT (id) DO NOTHING;

-- RLS Policy: Users can upload documents for their animals
CREATE POLICY "Users can upload animal documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'animal-documents' 
  AND auth.uid() IN (
    SELECT user_id FROM animals 
    WHERE id::text = (storage.foldername(name))[1]
  )
);

-- RLS Policy: Users can view documents for their animals
CREATE POLICY "Users can view their animal documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'animal-documents'
  AND auth.uid() IN (
    SELECT user_id FROM animals 
    WHERE id::text = (storage.foldername(name))[1]
  )
);

-- RLS Policy: Users can delete documents for their animals
CREATE POLICY "Users can delete their animal documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'animal-documents'
  AND auth.uid() IN (
    SELECT user_id FROM animals 
    WHERE id::text = (storage.foldername(name))[1]
  )
);

-- Add indexes to animal_attachments for faster queries
CREATE INDEX IF NOT EXISTS idx_animal_attachments_animal_id 
ON animal_attachments(animal_id);

CREATE INDEX IF NOT EXISTS idx_animal_attachments_type 
ON animal_attachments(attachment_type);

CREATE INDEX IF NOT EXISTS idx_animal_attachments_user_animal 
ON animal_attachments(user_id, animal_id);