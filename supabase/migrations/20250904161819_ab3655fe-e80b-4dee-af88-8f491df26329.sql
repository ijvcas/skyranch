-- Performance optimization: Add database indexes for frequently queried fields
-- This will significantly speed up animal queries and breeding calculations

-- Index for animal queries by user_id and lifecycle_status (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_animals_user_lifecycle ON animals(user_id, lifecycle_status);

-- Index for animal queries by species (used in breeding recommendations)
CREATE INDEX IF NOT EXISTS idx_animals_species ON animals(species);

-- Index for animal queries by gender (critical for breeding calculations)
CREATE INDEX IF NOT EXISTS idx_animals_gender ON animals(gender);

-- Index for animal queries by health_status (used in breeding recommendations)
CREATE INDEX IF NOT EXISTS idx_animals_health_status ON animals(health_status);

-- Index for parent lookups in pedigree calculations
CREATE INDEX IF NOT EXISTS idx_animals_mother_id ON animals(mother_id) WHERE mother_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_animals_father_id ON animals(father_id) WHERE father_id IS NOT NULL;

-- Index for animal lot assignments (frequently queried)
CREATE INDEX IF NOT EXISTS idx_animal_lot_assignments_animal_id ON animal_lot_assignments(animal_id);
CREATE INDEX IF NOT EXISTS idx_animal_lot_assignments_lot_id ON animal_lot_assignments(lot_id);
CREATE INDEX IF NOT EXISTS idx_animal_lot_assignments_removed_date ON animal_lot_assignments(removed_date) WHERE removed_date IS NULL;

-- Index for breeding records queries with correct column names
CREATE INDEX IF NOT EXISTS idx_breeding_records_user_id ON breeding_records(user_id);
CREATE INDEX IF NOT EXISTS idx_breeding_records_father_id ON breeding_records(father_id);
CREATE INDEX IF NOT EXISTS idx_breeding_records_mother_id ON breeding_records(mother_id);

-- Index for notifications queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read, created_at) WHERE read = false;