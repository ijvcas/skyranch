-- Add support for multiple animals in calendar events
ALTER TABLE calendar_events 
ADD COLUMN animal_ids TEXT[] DEFAULT NULL;

-- Add comment to clarify the usage
COMMENT ON COLUMN calendar_events.animal_ids IS 'Array of animal IDs associated with this event. Use this instead of animal_id for multiple animal selection.';

-- Note: We keep animal_id for backward compatibility, but animal_ids takes precedence when populated