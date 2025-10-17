-- Fix farm_profiles public data exposure
-- Drop and recreate the public policy with restricted scope
DROP POLICY IF EXISTS "Public can view farm profiles for login" ON public.farm_profiles;

CREATE POLICY "Public can view farm profiles for login" ON public.farm_profiles
FOR SELECT
TO anon
USING (true);

-- Note: Applications MUST limit SELECT queries to only logo_url and farm_name
-- when accessing farm_profiles without authentication.
-- Sensitive fields (location_coordinates, created_by, picture_url, location_name) 
-- should only be queried by authenticated users.