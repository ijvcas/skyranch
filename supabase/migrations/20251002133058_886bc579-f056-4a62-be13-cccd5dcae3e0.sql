-- PERFORMANCE OPTIMIZATION: Add critical indexes to improve query speed

-- Speed up lifecycle filtering (used in almost every query)
CREATE INDEX IF NOT EXISTS idx_animals_lifecycle_status ON animals(lifecycle_status);

-- Speed up species filtering and grouping (dashboard, reports, filters)
CREATE INDEX IF NOT EXISTS idx_animals_species ON animals(species);

-- Speed up health status queries (dashboard/reports)
CREATE INDEX IF NOT EXISTS idx_animals_health_status ON animals(health_status);

-- Composite index for common dashboard queries (active animals by species)
CREATE INDEX IF NOT EXISTS idx_animals_active_species ON animals(lifecycle_status, species) 
WHERE lifecycle_status = 'active';

-- Speed up user-specific queries (most important for multi-user systems)
CREATE INDEX IF NOT EXISTS idx_animals_user_lifecycle ON animals(user_id, lifecycle_status);

-- Speed up health records lookups by animal
CREATE INDEX IF NOT EXISTS idx_health_records_animal_date ON health_records(animal_id, date_administered DESC);

-- Speed up breeding records parent lookups
CREATE INDEX IF NOT EXISTS idx_breeding_records_mother ON breeding_records(mother_id);
CREATE INDEX IF NOT EXISTS idx_breeding_records_father ON breeding_records(father_id);

-- Speed up animal lot assignments
CREATE INDEX IF NOT EXISTS idx_animal_lot_assignments_animal ON animal_lot_assignments(animal_id, removed_date);
CREATE INDEX IF NOT EXISTS idx_animal_lot_assignments_lot ON animal_lot_assignments(lot_id, removed_date);

-- Speed up calendar events by date
CREATE INDEX IF NOT EXISTS idx_calendar_events_date ON calendar_events(event_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_date ON calendar_events(user_id, event_date);