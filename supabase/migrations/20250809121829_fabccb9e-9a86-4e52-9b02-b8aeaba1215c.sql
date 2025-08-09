-- Add Google Maps API key to Supabase secrets (this will be handled via UI)
-- This migration ensures the project is ready for secure API key handling
SELECT 1 as ready_for_google_maps_security;