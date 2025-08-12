-- 1) Helper masking functions
CREATE OR REPLACE FUNCTION public.mask_email(_email text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE 
    WHEN _email IS NULL THEN NULL
    WHEN position('@' in _email) = 0 THEN '***'
    ELSE substr(_email, 1, 1) || '***' || substr(_email, position('@' in _email))
  END;
$$;

CREATE OR REPLACE FUNCTION public.mask_phone(_phone text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE 
    WHEN _phone IS NULL THEN NULL
    WHEN length(_phone) <= 4 THEN '***'
    ELSE '***' || right(_phone, 4)
  END;
$$;

-- 2) Audit table for contact data access
CREATE TABLE IF NOT EXISTS public.contact_access_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  action text NOT NULL DEFAULT 'view_contacts',
  target_user_id uuid,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_access_audit ENABLE ROW LEVEL SECURITY;

-- Allow admins to view audit logs
CREATE POLICY IF NOT EXISTS "Admins can view contact access audit"
ON public.contact_access_audit
FOR SELECT
USING (public.get_current_app_role() = 'admin');

-- Allow authenticated users to insert audit entries (used by SECURITY DEFINER function if needed elsewhere)
CREATE POLICY IF NOT EXISTS "Authenticated can insert contact access audit"
ON public.contact_access_audit
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- 3) Secure RPC to return sanitized app users
CREATE OR REPLACE FUNCTION public.get_app_users_sanitized(include_contact boolean DEFAULT false)
RETURNS TABLE (
  id uuid,
  name text,
  email text,
  phone text,
  role text,
  is_active boolean,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  is_admin boolean := (public.get_current_app_role() = 'admin');
BEGIN
  IF include_contact AND is_admin THEN
    -- Log bulk unmasked access
    INSERT INTO public.contact_access_audit(admin_id, target_user_id, reason)
    VALUES (auth.uid(), NULL, 'bulk_list');

    RETURN QUERY
    SELECT au.id, au.name, au.email, au.phone, au.role, au.is_active, au.created_at
    FROM public.app_users au;
  ELSE
    RETURN QUERY
    SELECT au.id, au.name, public.mask_email(au.email) AS email, public.mask_phone(au.phone) AS phone,
           au.role, au.is_active, au.created_at
    FROM public.app_users au;
  END IF;
END;
$$;

-- 4) Tighten RLS: remove broad admin SELECT directly on table (force use of RPC)
DROP POLICY IF EXISTS "Admins can view all app_users" ON public.app_users;