-- Create enum for owner types
CREATE TYPE public.owner_type AS ENUM ('individual', 'company', 'cooperative', 'government');

-- Create parcel_owners table
CREATE TABLE public.parcel_owners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parcel_id UUID NOT NULL REFERENCES public.cadastral_parcels(id) ON DELETE CASCADE,
  owner_name TEXT NOT NULL,
  owner_type public.owner_type NOT NULL DEFAULT 'individual',
  contact_phone TEXT,
  contact_email TEXT,
  contact_address TEXT,
  identification_number TEXT,
  ownership_percentage NUMERIC(5,2) NOT NULL DEFAULT 100.00,
  is_primary_contact BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for efficient queries
CREATE INDEX idx_parcel_owners_parcel_id ON public.parcel_owners(parcel_id);
CREATE INDEX idx_parcel_owners_name ON public.parcel_owners(owner_name);
CREATE INDEX idx_parcel_owners_email ON public.parcel_owners(contact_email);

-- Create constraint to ensure ownership percentages don't exceed 100% per parcel
CREATE OR REPLACE FUNCTION validate_ownership_percentage()
RETURNS TRIGGER AS $$
BEGIN
  IF (
    SELECT COALESCE(SUM(ownership_percentage), 0) 
    FROM public.parcel_owners 
    WHERE parcel_id = NEW.parcel_id 
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) + NEW.ownership_percentage > 100 THEN
    RAISE EXCEPTION 'Total ownership percentage cannot exceed 100%% for parcel';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_ownership_percentage_trigger
  BEFORE INSERT OR UPDATE ON public.parcel_owners
  FOR EACH ROW EXECUTE FUNCTION validate_ownership_percentage();

-- Enable RLS
ALTER TABLE public.parcel_owners ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Active users can view all parcel owners"
ON public.parcel_owners
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND 
  EXISTS (
    SELECT 1 FROM public.app_users 
    WHERE id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Admins and managers can insert parcel owners"
ON public.parcel_owners
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  get_current_app_role() = ANY(ARRAY['admin', 'manager'])
);

CREATE POLICY "Admins and managers can update parcel owners"
ON public.parcel_owners
FOR UPDATE
USING (
  auth.uid() IS NOT NULL AND 
  get_current_app_role() = ANY(ARRAY['admin', 'manager'])
);

CREATE POLICY "Admins can delete parcel owners"
ON public.parcel_owners
FOR DELETE
USING (
  auth.uid() IS NOT NULL AND 
  get_current_app_role() = 'admin'
);

-- Add trigger for updated_at
CREATE TRIGGER update_parcel_owners_updated_at
  BEFORE UPDATE ON public.parcel_owners
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();