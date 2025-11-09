-- Phase 1: CRITICAL SECURITY FIX - Complete user_roles table (Fixed)

-- Add missing columns to user_roles if they don't exist
DO $$ BEGIN
  ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS assigned_by UUID REFERENCES auth.users(id);
  ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create indices for performance (skip if exists)
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
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

-- Update get_current_app_role to use new table
CREATE OR REPLACE FUNCTION public.get_current_app_role()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Sync roles from app_users to user_roles for any missing entries
-- Only migrate users that actually exist in auth.users
INSERT INTO public.user_roles (user_id, role, assigned_by, assigned_at)
SELECT 
  au.id,
  au.role::app_role,
  au.created_by,
  au.created_at
FROM public.app_users au
INNER JOIN auth.users auth_u ON au.id = auth_u.id
WHERE au.role IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = au.id AND role = au.role::app_role
  )
ON CONFLICT (user_id, role) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can assign roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can modify roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can remove roles" ON public.user_roles;

-- RLS Policies for user_roles
CREATE POLICY "Admins can view all user roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR user_id = auth.uid()
);

CREATE POLICY "Admins can assign roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can modify roles"
ON public.user_roles FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can remove roles"
ON public.user_roles FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));