-- Add farm_id to subscriptions and subscription_usage tables
ALTER TABLE public.subscriptions 
ADD COLUMN farm_id UUID REFERENCES public.farm_profiles(id);

ALTER TABLE public.subscription_usage 
ADD COLUMN farm_id UUID REFERENCES public.farm_profiles(id);

-- Migrate existing subscription data to be farm-based
-- Link each user's subscription to their farm (via farm_profiles.owner_user_id)
UPDATE public.subscriptions s
SET farm_id = (
  SELECT fp.id 
  FROM public.farm_profiles fp 
  WHERE fp.owner_user_id = s.user_id
  LIMIT 1
)
WHERE farm_id IS NULL;

-- Migrate usage data to farm-based and consolidate counts
UPDATE public.subscription_usage su
SET farm_id = (
  SELECT fp.id 
  FROM public.farm_profiles fp 
  WHERE fp.owner_user_id = su.user_id
  LIMIT 1
)
WHERE farm_id IS NULL;

-- Update usage counts to reflect actual farm totals
UPDATE public.subscription_usage su
SET 
  users_count = (
    SELECT COUNT(DISTINCT au.id)
    FROM public.app_users au
    WHERE au.is_active = true
  ),
  animals_count = (
    SELECT COUNT(*)
    FROM public.animals a
    WHERE a.lifecycle_status != 'deceased'
  )
WHERE su.farm_id IS NOT NULL;

-- Create unique constraint on farm_id for subscriptions
CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_farm_id_unique ON public.subscriptions(farm_id);

-- Create unique constraint on farm_id for subscription_usage
CREATE UNIQUE INDEX IF NOT EXISTS subscription_usage_farm_id_unique ON public.subscription_usage(farm_id);

-- Update RLS policies for farm-based access
DROP POLICY IF EXISTS "Users can view their subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can view their usage" ON public.subscription_usage;

-- Farm users can view their farm's subscription
CREATE POLICY "Farm users can view farm subscription"
ON public.subscriptions FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND farm_id IN (
    SELECT fp.id FROM public.farm_profiles fp 
    WHERE EXISTS (
      SELECT 1 FROM public.app_users au 
      WHERE au.id = auth.uid() AND au.is_active = true
    )
  )
);

-- Farm users can view their farm's usage
CREATE POLICY "Farm users can view farm usage"
ON public.subscription_usage FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND farm_id IN (
    SELECT fp.id FROM public.farm_profiles fp 
    WHERE EXISTS (
      SELECT 1 FROM public.app_users au 
      WHERE au.id = auth.uid() AND au.is_active = true
    )
  )
);

-- Only farm owner can update subscription
CREATE POLICY "Farm owner can update subscription"
ON public.subscriptions FOR UPDATE
USING (
  auth.uid() IS NOT NULL 
  AND farm_id IN (
    SELECT fp.id FROM public.farm_profiles fp 
    WHERE fp.owner_user_id = auth.uid()
  )
);

-- System can update usage (for triggers)
CREATE POLICY "System can update usage"
ON public.subscription_usage FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- Create function to update usage counts automatically
CREATE OR REPLACE FUNCTION public.update_subscription_usage_counts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update all farm usage counts
  UPDATE public.subscription_usage su
  SET 
    users_count = (
      SELECT COUNT(DISTINCT au.id)
      FROM public.app_users au
      WHERE au.is_active = true
    ),
    animals_count = (
      SELECT COUNT(*)
      FROM public.animals a
      WHERE a.lifecycle_status != 'deceased'
    ),
    last_updated = NOW()
  WHERE su.farm_id IS NOT NULL;
END;
$$;