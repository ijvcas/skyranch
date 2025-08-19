-- Create a new emergency function that bypasses auth.uid() context issues
CREATE OR REPLACE FUNCTION public.get_user_animal_stats_emergency(target_user_id uuid)
 RETURNS TABLE(species_counts jsonb, total_count integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Validate that the requesting user is the target user or an admin
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  IF auth.uid() != target_user_id AND get_current_app_role() != 'admin' THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Return aggregated data directly for the specified user
  RETURN QUERY
  SELECT 
    COALESCE(jsonb_object_agg(species, species_count), '{}'::jsonb) as species_counts,
    COALESCE(SUM(species_count), 0)::integer as total_count
  FROM (
    SELECT 
      species,
      COUNT(*)::integer as species_count
    FROM public.animals 
    WHERE user_id = target_user_id 
      AND lifecycle_status != 'deceased'
    GROUP BY species
  ) grouped_data;
END;
$function$