-- Clean up conflicting RLS policies for app_users table
-- Remove the problematic policy that allows all authenticated users to view all app_users
DROP POLICY IF EXISTS "Authenticated users can view all app_users" ON public.app_users;
DROP POLICY IF EXISTS "Farm users can view all app_users" ON public.app_users;

-- Clean up duplicate policies for other tables
DROP POLICY IF EXISTS "Authenticated users can view all calendar events" ON public.calendar_events;
DROP POLICY IF EXISTS "Authenticated users can view all field reports" ON public.field_reports;
DROP POLICY IF EXISTS "Authenticated users can view all field report entries" ON public.field_report_entries;
DROP POLICY IF EXISTS "Authenticated users can manage weather settings" ON public.weather_settings;
DROP POLICY IF EXISTS "Authenticated users can manage farm profiles" ON public.farm_profiles;
DROP POLICY IF EXISTS "Authenticated users can manage cadastral parcels" ON public.cadastral_parcels;

-- Ensure simple, non-conflicting policies exist for app_users
-- Admin can see all users, workers can only see their own profile
CREATE POLICY "Admins can view all app_users" 
ON public.app_users 
FOR SELECT 
USING (get_current_app_role() = 'admin');

CREATE POLICY "Users can view only their own profile data" 
ON public.app_users 
FOR SELECT 
USING (auth.uid() = id AND get_current_app_role() = ANY(ARRAY['admin', 'worker']));

-- Create a simpler, optimized function for dashboard animal data
CREATE OR REPLACE FUNCTION public.get_dashboard_animal_stats()
RETURNS TABLE(species_counts jsonb, total_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_user_id uuid := auth.uid();
BEGIN
  IF current_user_id IS NULL THEN
    RETURN QUERY
    SELECT '{}'::jsonb as species_counts, 0 as total_count;
    RETURN;
  END IF;

  -- Return aggregated data directly instead of raw rows
  RETURN QUERY
  SELECT 
    jsonb_object_agg(species, species_count) as species_counts,
    SUM(species_count)::integer as total_count
  FROM (
    SELECT 
      species,
      COUNT(*)::integer as species_count
    FROM public.animals 
    WHERE user_id = current_user_id 
      AND lifecycle_status != 'deceased'
    GROUP BY species
  ) grouped_data;
END;
$function$;