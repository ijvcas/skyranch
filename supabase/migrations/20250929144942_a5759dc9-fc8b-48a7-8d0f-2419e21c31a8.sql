-- Update RLS policies for cadastral_parcels to allow managers to edit

-- Drop the existing update policy that only allows admins
DROP POLICY IF EXISTS "Admin only can update cadastral parcels" ON public.cadastral_parcels;

-- Create new update policy allowing both admins and managers
CREATE POLICY "Admins and managers can update cadastral parcels" 
ON public.cadastral_parcels 
FOR UPDATE 
USING (
  (auth.uid() IS NOT NULL) AND 
  (get_current_app_role() IN ('admin', 'manager'))
);

-- Update the comments to clarify the permission structure
COMMENT ON POLICY "Admins and managers can update cadastral parcels" ON public.cadastral_parcels IS 'Allow admins and managers to update cadastral parcel information including status, financial details, and owner information';