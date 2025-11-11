-- Add NFC tracking fields to animals table
ALTER TABLE public.animals 
ADD COLUMN IF NOT EXISTS nfc_tag_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS nfc_last_scanned_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS nfc_scan_count INTEGER DEFAULT 0;

-- Add barcode column to animals table
ALTER TABLE public.animals
ADD COLUMN IF NOT EXISTS barcode TEXT UNIQUE;

-- Create index for NFC tag lookups
CREATE INDEX IF NOT EXISTS idx_animals_nfc_tag_id ON public.animals(nfc_tag_id);

-- Create index for barcode lookups
CREATE INDEX IF NOT EXISTS idx_animals_barcode ON public.animals(barcode);

-- Create barcode_registry table
CREATE TABLE IF NOT EXISTS public.barcode_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barcode TEXT NOT NULL UNIQUE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('animal', 'inventory', 'equipment', 'lot', 'user')),
  entity_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  notes TEXT,
  is_active BOOLEAN DEFAULT true
);

-- Create index for barcode registry lookups
CREATE INDEX IF NOT EXISTS idx_barcode_registry_barcode ON public.barcode_registry(barcode) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_barcode_registry_entity ON public.barcode_registry(entity_type, entity_id);

-- Create barcode_scan_history table for analytics
CREATE TABLE IF NOT EXISTS public.barcode_scan_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barcode TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  scanned_by UUID REFERENCES auth.users(id),
  scanned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  scan_location JSONB,
  scan_context TEXT,
  device_info JSONB
);

-- Create index for scan history analytics
CREATE INDEX IF NOT EXISTS idx_barcode_scan_history_barcode ON public.barcode_scan_history(barcode);
CREATE INDEX IF NOT EXISTS idx_barcode_scan_history_entity ON public.barcode_scan_history(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_barcode_scan_history_scanned_at ON public.barcode_scan_history(scanned_at DESC);

-- Enable RLS on new tables
ALTER TABLE public.barcode_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barcode_scan_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for barcode_registry
CREATE POLICY "Active users can view barcode registry"
  ON public.barcode_registry FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (SELECT 1 FROM public.app_users WHERE id = auth.uid() AND is_active = true)
  );

CREATE POLICY "Active users can insert barcode registry"
  ON public.barcode_registry FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (SELECT 1 FROM public.app_users WHERE id = auth.uid() AND is_active = true) AND
    created_by = auth.uid()
  );

CREATE POLICY "Admins can update barcode registry"
  ON public.barcode_registry FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND
    get_current_app_role() = 'admin'
  );

CREATE POLICY "Admins can delete barcode registry"
  ON public.barcode_registry FOR DELETE
  USING (
    auth.uid() IS NOT NULL AND
    get_current_app_role() = 'admin'
  );

-- RLS Policies for barcode_scan_history
CREATE POLICY "Active users can view scan history"
  ON public.barcode_scan_history FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (SELECT 1 FROM public.app_users WHERE id = auth.uid() AND is_active = true)
  );

CREATE POLICY "Active users can insert scan history"
  ON public.barcode_scan_history FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (SELECT 1 FROM public.app_users WHERE id = auth.uid() AND is_active = true) AND
    scanned_by = auth.uid()
  );

-- Add comments for documentation
COMMENT ON TABLE public.barcode_registry IS 'Universal barcode registry mapping barcodes to any entity type';
COMMENT ON TABLE public.barcode_scan_history IS 'Analytics tracking for all barcode scans';
COMMENT ON COLUMN public.animals.nfc_tag_id IS 'NFC tag identifier for contactless scanning';
COMMENT ON COLUMN public.animals.barcode IS 'Barcode identifier for optical scanning';