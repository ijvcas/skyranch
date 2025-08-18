-- Update RLS policies for calendar_events to allow all authenticated users to view all events
DROP POLICY IF EXISTS "Users can view their own calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Users can manage their own events" ON calendar_events;

CREATE POLICY "Authenticated users can view all calendar events" 
ON calendar_events 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create their own calendar events" 
ON calendar_events 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calendar events" 
ON calendar_events 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calendar events" 
ON calendar_events 
FOR DELETE 
USING (auth.uid() = user_id);

-- Update RLS policies for field_reports to allow all authenticated users to view all reports
DROP POLICY IF EXISTS "Users can view their own field reports" ON field_reports;

CREATE POLICY "Authenticated users can view all field reports" 
ON field_reports 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Update RLS policies for field_report_entries to allow all authenticated users to view all entries
DROP POLICY IF EXISTS "Users can view entries of their own field reports" ON field_report_entries;

CREATE POLICY "Authenticated users can view all field report entries" 
ON field_report_entries 
FOR SELECT 
USING (auth.uid() IS NOT NULL);