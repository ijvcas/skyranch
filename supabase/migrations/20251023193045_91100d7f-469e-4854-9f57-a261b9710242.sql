-- Update existing farm profiles to use FARMIKA branding
UPDATE farm_profiles 
SET 
  farm_name = 'FARMIKA',
  updated_at = now()
WHERE farm_name = 'SKYRANCH' OR farm_name = 'SkyRanch' OR farm_name = 'Mi Finca';

-- Set default farm name for any future records that might be created without explicit name
-- This ensures consistent branding across the application
COMMENT ON COLUMN farm_profiles.farm_name IS 'Farm name - defaults to FARMIKA for the application';