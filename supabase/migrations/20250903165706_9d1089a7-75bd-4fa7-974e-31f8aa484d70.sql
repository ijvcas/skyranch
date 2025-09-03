-- Fix RLS policies for data exposure issues

-- Update support_settings to require authentication for viewing
DROP POLICY IF EXISTS "Authenticated users can view weather settings" ON public.support_settings;
DROP POLICY IF EXISTS "Farm users can view all weather settings" ON public.support_settings;

CREATE POLICY "Authenticated users can view support settings" 
ON public.support_settings 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Update dashboard_banners to require authentication for viewing  
DROP POLICY IF EXISTS "Anyone can view active dashboard banners" ON public.dashboard_banners;

CREATE POLICY "Authenticated users can view active dashboard banners" 
ON public.dashboard_banners 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND is_active = true);