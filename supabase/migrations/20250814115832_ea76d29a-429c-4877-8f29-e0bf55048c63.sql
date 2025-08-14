-- Fix security warnings by setting proper search_path for all functions

-- Update calculate_expected_exit_date function
CREATE OR REPLACE FUNCTION public.calculate_expected_exit_date(
  entry_date date,
  max_grazing_days integer,
  current_animals integer,
  lot_capacity integer
) RETURNS date
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  occupancy_factor numeric;
  adjusted_days integer;
BEGIN
  IF lot_capacity IS NULL OR lot_capacity = 0 THEN
    RETURN entry_date + max_grazing_days;
  END IF;
  
  occupancy_factor := CASE 
    WHEN current_animals::numeric / lot_capacity::numeric > 0.8 THEN 0.7
    WHEN current_animals::numeric / lot_capacity::numeric > 0.6 THEN 0.8
    WHEN current_animals::numeric / lot_capacity::numeric > 0.4 THEN 0.9
    ELSE 1.0
  END;
  
  adjusted_days := GREATEST(1, (max_grazing_days * occupancy_factor)::integer);
  
  RETURN entry_date + adjusted_days;
END;
$$;

-- Update calculate_next_available_date function
CREATE OR REPLACE FUNCTION public.calculate_next_available_date(
  last_grazing_end_date date,
  rest_days_required integer
) RETURNS date
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF last_grazing_end_date IS NULL THEN
    RETURN CURRENT_DATE;
  END IF;
  
  RETURN last_grazing_end_date + COALESCE(rest_days_required, 30);
END;
$$;

-- Update get_lot_grazing_metrics function
CREATE OR REPLACE FUNCTION public.get_lot_grazing_metrics(lot_id_param uuid)
RETURNS TABLE(
  current_animals_count integer,
  occupancy_percentage numeric,
  entry_date date,
  expected_exit_date date,
  days_in_lot integer,
  recommended_exit_date date,
  next_available_date date,
  lot_status text,
  is_overdue boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  lot_record record;
  animal_count integer;
  earliest_entry date;
  latest_entry date;
BEGIN
  -- Get lot information
  SELECT l.capacity, l.max_grazing_days, l.rest_days_required, l.last_grazing_end_date, l.status
  INTO lot_record
  FROM lots l
  WHERE l.id = lot_id_param;
  
  IF lot_record IS NULL THEN
    RETURN;
  END IF;
  
  -- Get current animals and entry dates
  SELECT 
    COUNT(*),
    MIN(DATE(ala.assigned_date)),
    MAX(DATE(ala.assigned_date))
  INTO animal_count, earliest_entry, latest_entry
  FROM animal_lot_assignments ala
  WHERE ala.lot_id = lot_id_param 
    AND ala.removed_date IS NULL;
  
  -- Calculate metrics
  current_animals_count := COALESCE(animal_count, 0);
  occupancy_percentage := CASE 
    WHEN lot_record.capacity IS NULL OR lot_record.capacity = 0 THEN 0
    ELSE ROUND((current_animals_count::numeric / lot_record.capacity::numeric) * 100, 1)
  END;
  
  entry_date := earliest_entry;
  
  IF entry_date IS NOT NULL THEN
    expected_exit_date := calculate_expected_exit_date(
      entry_date,
      COALESCE(lot_record.max_grazing_days, 15),
      current_animals_count,
      lot_record.capacity
    );
    
    days_in_lot := CURRENT_DATE - entry_date;
    is_overdue := CURRENT_DATE > expected_exit_date;
    recommended_exit_date := expected_exit_date;
  END IF;
  
  next_available_date := calculate_next_available_date(
    lot_record.last_grazing_end_date,
    COALESCE(lot_record.rest_days_required, 30)
  );
  
  -- Determine lot status
  lot_status := CASE
    WHEN current_animals_count > 0 THEN 'active'
    WHEN lot_record.last_grazing_end_date IS NOT NULL AND CURRENT_DATE < next_available_date THEN 'resting'
    ELSE 'available'
  END;
  
  RETURN NEXT;
END;
$$;

-- Update update_lot_status_on_assignment_change function
CREATE OR REPLACE FUNCTION public.update_lot_status_on_assignment_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_animals_count integer;
  lot_record record;
BEGIN
  -- Get the lot_id from either NEW or OLD record
  SELECT COALESCE(NEW.lot_id, OLD.lot_id) INTO lot_record.lot_id;
  
  -- Count current animals in the lot
  SELECT COUNT(*)
  INTO current_animals_count
  FROM animal_lot_assignments
  WHERE lot_id = lot_record.lot_id 
    AND removed_date IS NULL;
  
  -- Update lot status and grazing dates
  IF current_animals_count = 0 THEN
    -- No animals, set to resting and update last grazing end date
    UPDATE lots 
    SET 
      status = 'resting',
      last_grazing_end_date = CURRENT_DATE,
      updated_at = NOW()
    WHERE id = lot_record.lot_id;
  ELSE
    -- Has animals, set to active and clear grazing start if this is first animal
    UPDATE lots 
    SET 
      status = 'active',
      grazing_start_date = CASE 
        WHEN grazing_start_date IS NULL THEN CURRENT_DATE 
        ELSE grazing_start_date 
      END,
      updated_at = NOW()
    WHERE id = lot_record.lot_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;