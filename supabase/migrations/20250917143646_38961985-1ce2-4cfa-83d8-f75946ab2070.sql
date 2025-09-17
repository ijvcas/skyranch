-- Performance optimization indexes for animals table (non-concurrent)
-- Composite index for user queries with lifecycle status and ordering
CREATE INDEX IF NOT EXISTS idx_animals_user_lifecycle_created 
ON public.animals (user_id, lifecycle_status, created_at DESC);

-- Partial index for active animals (most common query)
CREATE INDEX IF NOT EXISTS idx_animals_active_only 
ON public.animals (user_id, created_at DESC) 
WHERE lifecycle_status != 'deceased';

-- Index for species filtering (commonly used in dashboard)
CREATE INDEX IF NOT EXISTS idx_animals_species_active 
ON public.animals (user_id, species) 
WHERE lifecycle_status != 'deceased';

-- Optimize health status queries
CREATE INDEX IF NOT EXISTS idx_animals_health_status 
ON public.animals (user_id, health_status, lifecycle_status);