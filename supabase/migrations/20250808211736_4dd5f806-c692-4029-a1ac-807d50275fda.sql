-- Fix security warnings for functions with mutable search paths
ALTER FUNCTION public.update_updated_at_column() SET search_path = 'public';
ALTER FUNCTION public.set_updated_at() SET search_path = 'public';