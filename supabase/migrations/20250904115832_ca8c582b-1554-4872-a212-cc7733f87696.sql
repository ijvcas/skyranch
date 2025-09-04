-- Fix duplicate P-1 lots issue
-- First, remove duplicate animal assignments keeping the newer lot (Juan Casanova's)
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

-- Create a function to prevent duplicate active animal assignments
CREATE OR REPLACE FUNCTION prevent_duplicate_animal_assignments()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if animal is already assigned to another lot
  IF EXISTS (
    SELECT 1 FROM animal_lot_assignments 
    WHERE animal_id = NEW.animal_id 
      AND lot_id != NEW.lot_id 
      AND removed_date IS NULL
  ) THEN
    RAISE EXCEPTION 'Animal is already assigned to another lot. Remove from current lot first.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to prevent duplicate assignments
DROP TRIGGER IF EXISTS check_duplicate_assignments ON animal_lot_assignments;
CREATE TRIGGER check_duplicate_assignments
  BEFORE INSERT ON animal_lot_assignments
  FOR EACH ROW
  EXECUTE FUNCTION prevent_duplicate_animal_assignments();