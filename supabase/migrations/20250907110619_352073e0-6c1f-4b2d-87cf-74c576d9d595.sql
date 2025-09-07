-- Remove the conflicting permissive policy on support_settings
-- This policy allowed all authenticated users to view support settings
DROP POLICY IF EXISTS "Authenticated users can view support settings" ON support_settings;

-- The restrictive "Admin-only access to support settings" policy will remain
-- ensuring only admin users can access internal support contact information

-- Verify the remaining policies are correct
-- Expected policies after this change:
-- 1. "Admin-only access to support settings" (ALL operations for admins only)
-- This ensures proper data protection for internal contact information