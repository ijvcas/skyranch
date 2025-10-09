-- Add pedigree PDF URL column to animals table
ALTER TABLE public.animals 
ADD COLUMN IF NOT EXISTS pedigree_pdf_url TEXT;

-- Create storage bucket for pedigree documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('pedigree-documents', 'pedigree-documents', false)
ON CONFLICT (id) DO NOTHING;

-- RLS Policy: Users can upload pedigree PDFs to their own folder
CREATE POLICY "Users can upload pedigree PDFs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'pedigree-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS Policy: Users can read their own pedigree PDFs
CREATE POLICY "Users can read their pedigree PDFs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'pedigree-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS Policy: Users can delete their own pedigree PDFs
CREATE POLICY "Users can delete their pedigree PDFs"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'pedigree-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);