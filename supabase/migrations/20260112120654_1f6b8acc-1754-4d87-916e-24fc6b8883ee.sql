-- Add cost column to tasks table
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS cost numeric DEFAULT null;