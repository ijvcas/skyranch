-- Clean up duplicate and conflicting RLS policies
DROP POLICY IF EXISTS "Authenticated users can view all app_users" ON public.app_users;
DROP POLICY IF EXISTS "Farm users can view all app_users" ON public.app_users;
DROP POLICY IF EXISTS "Authenticated users can view all calendar events" ON public.calendar_events;
DROP POLICY IF EXISTS "Authenticated users can view all field reports" ON public.field_reports;
DROP POLICY IF EXISTS "Authenticated users can view all field report entries" ON public.field_report_entries;
DROP POLICY IF EXISTS "Authenticated users can manage weather settings" ON public.weather_settings;
DROP POLICY IF EXISTS "Authenticated users can manage farm profiles" ON public.farm_profiles;
DROP POLICY IF EXISTS "Authenticated users can manage cadastral parcels" ON public.cadastral_parcels;

-- Create a simpler, optimized function for dashboard animal data that avoids RLS conflicts
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

  -- Return aggregated data directly instead of raw rows to avoid RLS policy conflicts
  RETURN QUERY
  SELECT 
    COALESCE(jsonb_object_agg(species, species_count), '{}'::jsonb) as species_counts,
    COALESCE(SUM(species_count), 0)::integer as total_count
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