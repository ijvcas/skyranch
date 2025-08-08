-- Fix the remaining function search path warning
ALTER FUNCTION public.create_lots_from_propiedad_parcels() SET search_path = 'public';