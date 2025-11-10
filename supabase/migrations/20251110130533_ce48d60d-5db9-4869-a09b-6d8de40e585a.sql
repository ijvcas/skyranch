-- Extend tasks table with field report capabilities
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS weather_conditions TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS temperature NUMERIC;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS location_coordinates TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS report_type TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completion_notes TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completion_photos TEXT[];
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS actual_completion_date TIMESTAMP WITH TIME ZONE;

-- Add comment to document the unified purpose
COMMENT ON TABLE tasks IS 'Unified activities table - handles both planned tasks and completed work logs';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_tasks_actual_completion_date ON tasks(actual_completion_date);
CREATE INDEX IF NOT EXISTS idx_tasks_report_type ON tasks(report_type);