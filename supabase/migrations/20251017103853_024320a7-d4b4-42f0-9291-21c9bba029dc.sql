-- Create user roles table with proper security architecture
-- This fixes the privilege escalation risk from storing roles directly on app_users

-- 1. Create role enum type
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'worker');

-- 2. Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  granted_at timestamp with time zone DEFAULT now(),
  granted_by uuid REFERENCES auth.users(id),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. RLS policies for user_roles
CREATE POLICY "Admins can view all user roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.app_users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can insert user roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.app_users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can delete user roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.app_users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 4. Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 5. Migrate existing roles from app_users to user_roles
-- Only migrate users that exist in auth.users to avoid foreign key violations
INSERT INTO public.user_roles (user_id, role, granted_by)
SELECT 
  au.id,
  au.role::app_role,
  au.created_by
FROM public.app_users au
INNER JOIN auth.users u ON u.id = au.id
ON CONFLICT (user_id, role) DO NOTHING;

-- 6. Update get_current_app_role() to use new table
CREATE OR REPLACE FUNCTION public.get_current_app_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT COALESCE(role::text, 'worker')
  FROM public.user_roles
  WHERE user_id = auth.uid()
  ORDER BY 
    CASE role
      WHEN 'admin' THEN 1
      WHEN 'manager' THEN 2
      WHEN 'worker' THEN 3
    END
  LIMIT 1
$function$;

-- 7. Add deprecation comment to app_users.role column
COMMENT ON COLUMN public.app_users.role IS 'DEPRECATED: Use user_roles table instead. Kept for backward compatibility during migration period.';