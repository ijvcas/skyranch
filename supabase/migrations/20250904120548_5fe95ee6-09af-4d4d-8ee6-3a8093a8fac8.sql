-- Fix security issue: Set search path for the function
CREATE OR REPLACE FUNCTION prevent_duplicate_animal_assignments()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;