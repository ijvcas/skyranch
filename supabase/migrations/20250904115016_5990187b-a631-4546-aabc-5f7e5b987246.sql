-- Fix duplicate P-1 lots issue
-- First, remove duplicate animal assignments keeping the newer lot (Juan Casanova's)
-- Remove animals from the older P-1 lot (Juan Espicy's) that are also in the newer one
DELETE FROM animal_lot_assignments 
WHERE lot_id = '4a42278d-64bb-494d-9cad-72f67b477afe' 
  AND animal_id IN (
    'caac4031-834f-4c95-8afd-1261d080f01b', -- CHORIZO
    '07fc8cbd-7d0a-463c-9498-1b53b85bd542', -- JAZZ  
    '9a6827c0-b81d-4c4a-aeb7-ce7332375416', -- KOINCHE
    '09b82402-a841-418d-a9e3-0d3800ce9452', -- PARRILLA
    'c43cd956-46b7-4890-b522-01a9ac2c1348'  -- SHIVA
  )
  AND removed_date IS NULL;

-- Add constraint to prevent animals from being in multiple lots simultaneously
ALTER TABLE animal_lot_assignments 
ADD CONSTRAINT unique_active_animal_assignment 
EXCLUDE USING gist (animal_id WITH =) 
WHERE (removed_date IS NULL);