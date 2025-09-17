-- Allow public access to view farm profiles for login page
DROP POLICY IF EXISTS "Public can view farm profiles for login" ON farm_profiles;
CREATE POLICY "Public can view farm profiles for login" 
ON farm_profiles 
FOR SELECT 
USING (true);