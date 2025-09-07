-- Fix RLS policies for lots table to enable shared potrero visibility
-- Drop existing restrictive policies first
DROP POLICY IF EXISTS "Active users can view all lots" ON public.lots;

-- Create new policy that truly allows all active users to see ALL lots
CREATE POLICY "All active users can view all lots" 
ON public.lots 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND 
  EXISTS (
    SELECT 1 FROM public.app_users 
    WHERE id = auth.uid() AND is_active = true
  )
);

-- Also update lot_polygons policies to ensure polygon data is accessible
DROP POLICY IF EXISTS "Users can view polygons for their lots" ON public.lot_polygons;

CREATE POLICY "Active users can view all lot polygons" 
ON public.lot_polygons 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND 
  EXISTS (
    SELECT 1 FROM public.app_users 
    WHERE id = auth.uid() AND is_active = true
  )
);

-- Keep INSERT policies restrictive for ownership tracking
-- Keep UPDATE/DELETE policies allowing all active users for shared management