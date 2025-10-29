-- ============================================================================
-- SECURITY FIX: Restrict DELETE operations to managers and admins
-- ============================================================================
-- This migration addresses the security finding "overly_permissive_rls_animals"
-- 
-- CHANGE: All active users could previously DELETE records from critical tables.
-- FIX: Only managers and admins can now DELETE records.
-- REASONING: Workers need to view and update farm data for day-to-day operations,
--            but destructive DELETE operations should be restricted to management.
-- ============================================================================

-- 1. ANIMALS TABLE
DROP POLICY IF EXISTS "Active users can delete all animals" ON public.animals;

CREATE POLICY "Managers and admins can delete animals"
ON public.animals
FOR DELETE
USING (
  auth.uid() IS NOT NULL 
  AND get_current_app_role() IN ('admin', 'manager')
);

-- 2. HEALTH RECORDS TABLE
DROP POLICY IF EXISTS "Active users can delete all health records" ON public.health_records;

CREATE POLICY "Managers and admins can delete health records"
ON public.health_records
FOR DELETE
USING (
  auth.uid() IS NOT NULL 
  AND get_current_app_role() IN ('admin', 'manager')
);

-- 3. BREEDING RECORDS TABLE
DROP POLICY IF EXISTS "Active users can delete all breeding records" ON public.breeding_records;

CREATE POLICY "Managers and admins can delete breeding records"
ON public.breeding_records
FOR DELETE
USING (
  auth.uid() IS NOT NULL 
  AND get_current_app_role() IN ('admin', 'manager')
);

-- 4. ANIMAL SALES TABLE
DROP POLICY IF EXISTS "Active users can delete all animal sales" ON public.animal_sales;

CREATE POLICY "Managers and admins can delete animal sales"
ON public.animal_sales
FOR DELETE
USING (
  auth.uid() IS NOT NULL 
  AND get_current_app_role() IN ('admin', 'manager')
);

-- 5. SALE PAYMENTS TABLE
DROP POLICY IF EXISTS "Active users can delete all sale payments" ON public.sale_payments;

CREATE POLICY "Managers and admins can delete sale payments"
ON public.sale_payments
FOR DELETE
USING (
  auth.uid() IS NOT NULL 
  AND get_current_app_role() IN ('admin', 'manager')
);

-- 6. FARM LEDGER TABLE
DROP POLICY IF EXISTS "Active users can delete all farm ledger entries" ON public.farm_ledger;

CREATE POLICY "Managers and admins can delete farm ledger entries"
ON public.farm_ledger
FOR DELETE
USING (
  auth.uid() IS NOT NULL 
  AND get_current_app_role() IN ('admin', 'manager')
);

-- 7. LOTS TABLE
DROP POLICY IF EXISTS "Active users can delete all lots" ON public.lots;

CREATE POLICY "Managers and admins can delete lots"
ON public.lots
FOR DELETE
USING (
  auth.uid() IS NOT NULL 
  AND get_current_app_role() IN ('admin', 'manager')
);

-- 8. ANIMAL LOT ASSIGNMENTS TABLE
DROP POLICY IF EXISTS "Active users can delete all animal lot assignments" ON public.animal_lot_assignments;

CREATE POLICY "Managers and admins can delete animal lot assignments"
ON public.animal_lot_assignments
FOR DELETE
USING (
  auth.uid() IS NOT NULL 
  AND get_current_app_role() IN ('admin', 'manager')
);

-- 9. ANIMAL ATTACHMENTS TABLE
DROP POLICY IF EXISTS "Active users can delete all animal attachments" ON public.animal_attachments;

CREATE POLICY "Managers and admins can delete animal attachments"
ON public.animal_attachments
FOR DELETE
USING (
  auth.uid() IS NOT NULL 
  AND get_current_app_role() IN ('admin', 'manager')
);

-- NOTE: SELECT and UPDATE policies remain unchanged - all active users can still
-- view and update records, which is appropriate for collaborative farm management.
-- Only DELETE operations are now restricted to prevent accidental data loss.