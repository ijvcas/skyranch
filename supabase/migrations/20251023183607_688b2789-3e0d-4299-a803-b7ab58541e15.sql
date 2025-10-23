-- Phase 2: Database Schema - Farm Ownership & User Invitations

-- 2.1: Enhance farm_profiles table with ownership and branding
ALTER TABLE public.farm_profiles 
ADD COLUMN IF NOT EXISTS farm_logo_url TEXT,
ADD COLUMN IF NOT EXISTS theme_primary_color TEXT DEFAULT '#16a34a',
ADD COLUMN IF NOT EXISTS theme_secondary_color TEXT DEFAULT '#22c55e',
ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS initialized BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS platform TEXT DEFAULT 'web';

-- Create index for fast owner lookups
CREATE INDEX IF NOT EXISTS idx_farm_profiles_owner 
ON public.farm_profiles(owner_user_id);

-- Set first admin as owner for existing SkyRanch data (testing)
UPDATE public.farm_profiles 
SET owner_user_id = (
  SELECT id FROM public.app_users 
  WHERE role = 'admin' 
  ORDER BY created_at ASC 
  LIMIT 1
)
WHERE owner_user_id IS NULL;

-- 2.2: Create user_invitations table
CREATE TABLE IF NOT EXISTS public.user_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  invited_by UUID REFERENCES auth.users(id) NOT NULL,
  invitation_token TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'worker' CHECK (role IN ('worker', 'manager', 'admin')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.user_invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.user_invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON public.user_invitations(status);

-- Enable RLS
ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Admins and managers can manage invitations
CREATE POLICY "Admins and managers can manage invitations"
ON public.user_invitations
FOR ALL
TO authenticated
USING (public.get_current_app_role() IN ('admin', 'manager'));

-- RLS Policy: Anyone can view their own pending invitation (for acceptance flow)
CREATE POLICY "Users can view pending invitations"
ON public.user_invitations
FOR SELECT
TO anon, authenticated
USING (status = 'pending' AND expires_at > NOW());

-- 2.3: Create factory_reset_logs table
CREATE TABLE IF NOT EXISTS public.factory_reset_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  farm_profile_id UUID REFERENCES public.farm_profiles(id),
  reset_date TIMESTAMPTZ DEFAULT NOW(),
  reset_reason TEXT,
  backup_created BOOLEAN DEFAULT false,
  backup_file_name TEXT,
  records_deleted JSONB
);

-- Enable RLS
ALTER TABLE public.factory_reset_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only admins can view reset logs
CREATE POLICY "Admins can view factory reset logs"
ON public.factory_reset_logs
FOR SELECT
TO authenticated
USING (public.get_current_app_role() = 'admin');

-- 2.4: Create factory reset function (owner-only)
CREATE OR REPLACE FUNCTION public.perform_factory_reset(
  reset_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  farm_id UUID;
  deleted_counts JSONB := '{}';
BEGIN
  -- Get farm profile ID
  SELECT id INTO farm_id
  FROM public.farm_profiles 
  WHERE owner_user_id = reset_user_id;
  
  -- Verify caller is owner
  IF NOT EXISTS (
    SELECT 1 FROM public.farm_profiles 
    WHERE owner_user_id = reset_user_id 
    AND owner_user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Only farm owner can perform factory reset';
  END IF;
  
  -- Log reset action BEFORE deletion
  INSERT INTO public.factory_reset_logs (
    user_id, 
    farm_profile_id, 
    reset_reason,
    backup_created,
    records_deleted
  ) VALUES (
    auth.uid(),
    farm_id,
    'Factory reset',
    true,
    jsonb_build_object(
      'animals', (SELECT COUNT(*) FROM animals),
      'lots', (SELECT COUNT(*) FROM lots),
      'users', (SELECT COUNT(*) FROM app_users WHERE id != reset_user_id)
    )
  );
  
  -- Delete all data (cascade will handle related records)
  DELETE FROM public.animals;
  DELETE FROM public.lots;
  DELETE FROM public.cadastral_parcels;
  DELETE FROM public.field_reports;
  DELETE FROM public.calendar_events;
  DELETE FROM public.notifications;
  DELETE FROM public.breeding_records;
  DELETE FROM public.health_records;
  
  -- Delete all users except owner
  DELETE FROM public.app_users WHERE id != reset_user_id;
  
  -- Reset farm profile but keep owner
  UPDATE public.farm_profiles 
  SET 
    initialized = false,
    farm_name = 'Mi Finca',
    farm_logo_url = NULL,
    theme_primary_color = '#16a34a',
    theme_secondary_color = '#22c55e',
    location_name = NULL,
    location_coordinates = NULL
  WHERE owner_user_id = reset_user_id;
  
  RETURN jsonb_build_object('success', true, 'farm_id', farm_id);
END;
$$;