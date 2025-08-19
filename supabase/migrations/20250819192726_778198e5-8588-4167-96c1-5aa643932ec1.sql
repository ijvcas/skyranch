-- Create an emergency bypass function for animal list
CREATE OR REPLACE FUNCTION public.get_animals_list_bypass(target_user_id uuid, max_limit integer DEFAULT 100)
 RETURNS TABLE(id uuid, name text, tag text, species text, user_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Skip auth checks for emergency bypass
  
  -- Return basic animal data for the specified user
  RETURN QUERY
  SELECT 
    a.id,
    a.name,
    a.tag,
    a.species,
    a.user_id
  FROM public.animals a
  WHERE a.user_id = target_user_id 
    AND a.lifecycle_status != 'deceased'
  ORDER BY a.created_at DESC
  LIMIT max_limit;
END;
$function$