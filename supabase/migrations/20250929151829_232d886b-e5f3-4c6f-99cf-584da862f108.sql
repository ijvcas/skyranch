-- Fix search path for function
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
$$ LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public;