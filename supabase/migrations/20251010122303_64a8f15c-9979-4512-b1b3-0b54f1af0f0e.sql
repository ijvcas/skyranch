-- Remove pedigree_pdf_url column from animals table
ALTER TABLE public.animals DROP COLUMN IF EXISTS pedigree_pdf_url;