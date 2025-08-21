-- Update RLS policy to allow admins to update any calendar event
DROP POLICY IF EXISTS "Users can update their calendar events" ON calendar_events;

CREATE POLICY "Users can update their calendar events" ON calendar_events
FOR UPDATE 
USING (auth.uid() = user_id OR get_current_app_role() = 'admin');

-- Also update delete policy for consistency
DROP POLICY IF EXISTS "Users can delete their calendar events" ON calendar_events;

CREATE POLICY "Users can delete their calendar events" ON calendar_events
FOR DELETE 
USING (auth.uid() = user_id OR get_current_app_role() = 'admin');