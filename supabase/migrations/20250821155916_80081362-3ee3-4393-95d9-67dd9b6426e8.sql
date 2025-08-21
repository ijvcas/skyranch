-- Update RLS policies to make all data shared among active users
-- Exception: cadastral parcel management restricted to admin role

-- 1. LOTS TABLE - Make shared data for all active users
DROP POLICY IF EXISTS "Users can create their own lots" ON public.lots;
DROP POLICY IF EXISTS "Users can delete their own lots" ON public.lots;
DROP POLICY IF EXISTS "Users can update their own lots" ON public.lots;
DROP POLICY IF EXISTS "Users can view their own lots" ON public.lots;

CREATE POLICY "Active users can view all lots"
ON public.lots
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.app_users 
    WHERE id = auth.uid() 
    AND is_active = true
  )
);

CREATE POLICY "Active users can insert lots"
ON public.lots
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.app_users 
    WHERE id = auth.uid() 
    AND is_active = true
  )
  AND user_id = auth.uid()
);

CREATE POLICY "Active users can update all lots"
ON public.lots
FOR UPDATE
USING (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.app_users 
    WHERE id = auth.uid() 
    AND is_active = true
  )
);

CREATE POLICY "Active users can delete all lots"
ON public.lots
FOR DELETE
USING (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.app_users 
    WHERE id = auth.uid() 
    AND is_active = true
  )
);

-- 2. BREEDING_RECORDS TABLE - Make shared data for all active users
DROP POLICY IF EXISTS "Users can create their own breeding records" ON public.breeding_records;
DROP POLICY IF EXISTS "Users can delete their own breeding records" ON public.breeding_records;
DROP POLICY IF EXISTS "Users can update their own breeding records" ON public.breeding_records;
DROP POLICY IF EXISTS "Users can view their own breeding records" ON public.breeding_records;

CREATE POLICY "Active users can view all breeding records"
ON public.breeding_records
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.app_users 
    WHERE id = auth.uid() 
    AND is_active = true
  )
);

CREATE POLICY "Active users can insert breeding records"
ON public.breeding_records
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.app_users 
    WHERE id = auth.uid() 
    AND is_active = true
  )
  AND user_id = auth.uid()
);

CREATE POLICY "Active users can update all breeding records"
ON public.breeding_records
FOR UPDATE
USING (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.app_users 
    WHERE id = auth.uid() 
    AND is_active = true
  )
);

CREATE POLICY "Active users can delete all breeding records"
ON public.breeding_records
FOR DELETE
USING (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.app_users 
    WHERE id = auth.uid() 
    AND is_active = true
  )
);

-- 3. HEALTH_RECORDS TABLE - Make shared data for all active users
DROP POLICY IF EXISTS "Users can create health records for their animals" ON public.health_records;
DROP POLICY IF EXISTS "Users can delete their own animal health records" ON public.health_records;
DROP POLICY IF EXISTS "Users can update their own animal health records" ON public.health_records;
DROP POLICY IF EXISTS "Users can view their own animal health records" ON public.health_records;

CREATE POLICY "Active users can view all health records"
ON public.health_records
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.app_users 
    WHERE id = auth.uid() 
    AND is_active = true
  )
);

CREATE POLICY "Active users can insert health records"
ON public.health_records
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.app_users 
    WHERE id = auth.uid() 
    AND is_active = true
  )
  AND user_id = auth.uid()
);

CREATE POLICY "Active users can update all health records"
ON public.health_records
FOR UPDATE
USING (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.app_users 
    WHERE id = auth.uid() 
    AND is_active = true
  )
);

CREATE POLICY "Active users can delete all health records"
ON public.health_records
FOR DELETE
USING (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.app_users 
    WHERE id = auth.uid() 
    AND is_active = true
  )
);

-- 4. ANIMAL_LOT_ASSIGNMENTS TABLE - Make shared data for all active users
DROP POLICY IF EXISTS "Users can create their own animal lot assignments" ON public.animal_lot_assignments;
DROP POLICY IF EXISTS "Users can delete their own animal lot assignments" ON public.animal_lot_assignments;
DROP POLICY IF EXISTS "Users can update their own animal lot assignments" ON public.animal_lot_assignments;
DROP POLICY IF EXISTS "Users can view their own animal lot assignments" ON public.animal_lot_assignments;

CREATE POLICY "Active users can view all animal lot assignments"
ON public.animal_lot_assignments
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.app_users 
    WHERE id = auth.uid() 
    AND is_active = true
  )
);

CREATE POLICY "Active users can insert animal lot assignments"
ON public.animal_lot_assignments
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.app_users 
    WHERE id = auth.uid() 
    AND is_active = true
  )
  AND user_id = auth.uid()
);

CREATE POLICY "Active users can update all animal lot assignments"
ON public.animal_lot_assignments
FOR UPDATE
USING (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.app_users 
    WHERE id = auth.uid() 
    AND is_active = true
  )
);

CREATE POLICY "Active users can delete all animal lot assignments"
ON public.animal_lot_assignments
FOR DELETE
USING (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.app_users 
    WHERE id = auth.uid() 
    AND is_active = true
  )
);

-- 5. ANIMAL_ATTACHMENTS TABLE - Make shared data for all active users
DROP POLICY IF EXISTS "Users can create their own animal attachments" ON public.animal_attachments;
DROP POLICY IF EXISTS "Users can delete their own animal attachments" ON public.animal_attachments;
DROP POLICY IF EXISTS "Users can view their own animal attachments" ON public.animal_attachments;

CREATE POLICY "Active users can view all animal attachments"
ON public.animal_attachments
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.app_users 
    WHERE id = auth.uid() 
    AND is_active = true
  )
);

CREATE POLICY "Active users can insert animal attachments"
ON public.animal_attachments
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.app_users 
    WHERE id = auth.uid() 
    AND is_active = true
  )
  AND user_id = auth.uid()
);

CREATE POLICY "Active users can delete all animal attachments"
ON public.animal_attachments
FOR DELETE
USING (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.app_users 
    WHERE id = auth.uid() 
    AND is_active = true
  )
);

-- 6. CADASTRAL_PARCELS TABLE - Restrict management to admin role only
DROP POLICY IF EXISTS "Active users can insert cadastral parcels" ON public.cadastral_parcels;
DROP POLICY IF EXISTS "Active users can update all cadastral parcels" ON public.cadastral_parcels;
DROP POLICY IF EXISTS "Active users can delete all cadastral parcels" ON public.cadastral_parcels;

-- Keep view access for all active users, but restrict management to admins
CREATE POLICY "Admin only can insert cadastral parcels"
ON public.cadastral_parcels
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND get_current_app_role() = 'admin'
);

CREATE POLICY "Admin only can update cadastral parcels"
ON public.cadastral_parcels
FOR UPDATE
USING (
  auth.uid() IS NOT NULL 
  AND get_current_app_role() = 'admin'
);

CREATE POLICY "Admin only can delete cadastral parcels"
ON public.cadastral_parcels
FOR DELETE
USING (
  auth.uid() IS NOT NULL 
  AND get_current_app_role() = 'admin'
);