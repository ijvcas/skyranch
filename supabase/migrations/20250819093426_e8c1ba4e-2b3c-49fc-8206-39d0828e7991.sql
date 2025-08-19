-- Fix RLS policies for single-organization farm management
-- Keep shared data policies for collaborative features

-- Update calendar_events: Keep shared access policy
CREATE POLICY "Farm users can view all calendar events" 
ON public.calendar_events 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Update field_reports: Keep shared access policy
CREATE POLICY "Farm users can view all field reports" 
ON public.field_reports 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Update field_report_entries: Keep shared access policy  
CREATE POLICY "Farm users can view all field report entries" 
ON public.field_report_entries 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Update cadastral_parcels: Keep shared access policy
CREATE POLICY "Farm users can view all cadastral parcels" 
ON public.cadastral_parcels 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Update farm_profiles: Keep shared access policy
CREATE POLICY "Farm users can view all farm profiles" 
ON public.farm_profiles 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Update weather_settings: Keep shared access policy
CREATE POLICY "Farm users can view all weather settings" 
ON public.weather_settings 
FOR SELECT 
USING (auth.uid() IS NOT NULL);