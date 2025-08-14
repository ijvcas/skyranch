-- Create cron job to run daily grazing notifications at 8 AM every day
SELECT cron.schedule(
  'daily-grazing-notifications',
  '0 8 * * *', -- At 8:00 AM every day
  $$
  SELECT
    net.http_post(
        url:='https://ahwhtxygyzoadsmdrwwg.supabase.co/functions/v1/daily-grazing-notifications',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFod2h0eHlneXpvYWRzbWRyd3dnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxMjIxNzMsImV4cCI6MjA2NDY5ODE3M30.rffEqABIU3U7e7qdPXLvNMQfqU2sNIJHrfP_A_5GrlI"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);

-- Update lot status logic to use simplified statuses
UPDATE lots 
SET status = 'available' 
WHERE status NOT IN ('available', 'active', 'resting');

-- Add indexes for better performance on grazing metrics queries
CREATE INDEX IF NOT EXISTS idx_animal_lot_assignments_lot_removed 
ON animal_lot_assignments(lot_id, removed_date) 
WHERE removed_date IS NULL;

CREATE INDEX IF NOT EXISTS idx_lots_user_status 
ON lots(user_id, status);

-- Update next_rotation_date for lots with current animals
UPDATE lots 
SET next_rotation_date = (
  SELECT 
    DATE(MIN(ala.assigned_date)) + INTERVAL '1 day' * COALESCE(lots.max_grazing_days, 15)
  FROM animal_lot_assignments ala 
  WHERE ala.lot_id = lots.id 
    AND ala.removed_date IS NULL
)
WHERE id IN (
  SELECT DISTINCT lot_id 
  FROM animal_lot_assignments 
  WHERE removed_date IS NULL
);