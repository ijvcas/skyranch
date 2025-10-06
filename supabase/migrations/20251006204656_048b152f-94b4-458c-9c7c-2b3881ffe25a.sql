-- Create storage bucket for pedigree documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pedigree-documents',
  'pedigree-documents',
  false,
  20971520, -- 20MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png']
);

-- Create RLS policies for pedigree documents bucket
CREATE POLICY "Users can upload their own pedigree documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'pedigree-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own pedigree documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'pedigree-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own pedigree documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'pedigree-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create pedigree_analyses table
CREATE TABLE public.pedigree_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  external_animal_name TEXT NOT NULL,
  external_pedigree_data JSONB NOT NULL,
  farm_animal_id UUID REFERENCES public.animals,
  document_url TEXT,
  analysis_result JSONB,
  inbreeding_coefficient NUMERIC,
  compatibility_score NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.pedigree_analyses ENABLE ROW LEVEL SECURITY;

-- RLS policies for pedigree_analyses
CREATE POLICY "Users can view their own pedigree analyses"
ON public.pedigree_analyses FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pedigree analyses"
ON public.pedigree_analyses FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pedigree analyses"
ON public.pedigree_analyses FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pedigree analyses"
ON public.pedigree_analyses FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_pedigree_analyses_updated_at
BEFORE UPDATE ON public.pedigree_analyses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();