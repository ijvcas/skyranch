-- Update farm_profiles table to remove unnecessary fields and add coordinates properly
ALTER TABLE public.farm_profiles 
DROP COLUMN IF EXISTS description,
DROP COLUMN IF EXISTS address,
DROP COLUMN IF EXISTS contact_email,
DROP COLUMN IF EXISTS contact_phone,
DROP COLUMN IF EXISTS website,
DROP COLUMN IF EXISTS established_year,
DROP COLUMN IF EXISTS farm_type,
DROP COLUMN IF EXISTS total_area_hectares;

-- Ensure location_coordinates stores proper lat,lng format
COMMENT ON COLUMN public.farm_profiles.location_coordinates IS 'Latitude,Longitude coordinates from Google Maps (e.g., "40.7128,-74.0060")';