-- Fix the database trigger function that's causing the "record not assigned yet" error
-- The issue is in the update_lot_status_on_assignment_change function where it tries to use lot_record before it's defined

-- First, let's recreate the function with proper variable assignment
CREATE OR REPLACE FUNCTION update_lot_status_on_assignment_change()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    target_lot_id UUID;
    lot_record RECORD;
    animal_count INTEGER;
    lot_capacity INTEGER;
BEGIN
    -- Determine which lot to update based on the operation
    IF TG_OP = 'INSERT' THEN
        target_lot_id := NEW.lot_id;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Handle both old and new lot if lot_id changed
        IF OLD.lot_id IS DISTINCT FROM NEW.lot_id THEN
            -- Update old lot status
            IF OLD.lot_id IS NOT NULL THEN
                PERFORM update_single_lot_status(OLD.lot_id);
            END IF;
            target_lot_id := NEW.lot_id;
        ELSE
            target_lot_id := NEW.lot_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        target_lot_id := OLD.lot_id;
    END IF;

    -- Update the target lot status if we have one
    IF target_lot_id IS NOT NULL THEN
        PERFORM update_single_lot_status(target_lot_id);
    END IF;

    -- Return appropriate record
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;

-- Create helper function to update individual lot status
CREATE OR REPLACE FUNCTION update_single_lot_status(target_lot_id UUID)
RETURNS VOID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    lot_record RECORD;
    animal_count INTEGER;
    lot_capacity INTEGER;
BEGIN
    -- Get lot information
    SELECT * INTO lot_record 
    FROM lots 
    WHERE id = target_lot_id;
    
    -- Exit if lot doesn't exist
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    -- Count current animals in the lot
    SELECT COUNT(*) INTO animal_count
    FROM animal_lot_assignments
    WHERE lot_id = target_lot_id 
    AND removed_date IS NULL;
    
    lot_capacity := COALESCE(lot_record.capacity, 0);
    
    -- Update lot status based on occupancy
    IF animal_count = 0 THEN
        UPDATE lots 
        SET status = 'active'
        WHERE id = target_lot_id;
    ELSIF animal_count >= lot_capacity AND lot_capacity > 0 THEN
        UPDATE lots 
        SET status = 'occupied'
        WHERE id = target_lot_id;
    ELSE
        UPDATE lots 
        SET status = 'active'
        WHERE id = target_lot_id;
    END IF;
END;
$$;