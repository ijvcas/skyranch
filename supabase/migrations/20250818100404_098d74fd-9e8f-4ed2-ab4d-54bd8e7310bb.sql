-- Drop all existing calendar_events policies
DROP POLICY IF EXISTS "Users can view their own calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Users can manage their own events" ON calendar_events;
DROP POLICY IF EXISTS "Users can create their own calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Users can update their own calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Users can delete their own calendar events" ON calendar_events;

-- Create new policies for calendar_events
CREATE POLICY "Authenticated users can view all calendar events" 
ON calendar_events 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create calendar events" 
ON calendar_events 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their calendar events" 
ON calendar_events 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their calendar events" 
ON calendar_events 
FOR DELETE 
USING (auth.uid() = user_id);

-- Drop all existing field_reports policies and recreate
DROP POLICY IF EXISTS "Users can view their own field reports" ON field_reports;
DROP POLICY IF EXISTS "Users can create their own field reports" ON field_reports;
DROP POLICY IF EXISTS "Users can update their own field reports" ON field_reports;
DROP POLICY IF EXISTS "Users can delete their own field reports" ON field_reports;

CREATE POLICY "Authenticated users can view all field reports" 
ON field_reports 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create field reports" 
ON field_reports 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their field reports" 
ON field_reports 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their field reports" 
ON field_reports 
FOR DELETE 
USING (auth.uid() = user_id);

-- Drop all existing field_report_entries policies and recreate
DROP POLICY IF EXISTS "Users can view entries of their own field reports" ON field_report_entries;
DROP POLICY IF EXISTS "Users can create entries for their own field reports" ON field_report_entries;
DROP POLICY IF EXISTS "Users can update entries of their own field reports" ON field_report_entries;
DROP POLICY IF EXISTS "Users can delete entries of their own field reports" ON field_report_entries;

CREATE POLICY "Authenticated users can view all field report entries" 
ON field_report_entries 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create entries for their field reports" 
ON field_report_entries 
FOR INSERT 
WITH CHECK (EXISTS ( SELECT 1 FROM field_reports fr WHERE fr.id = field_report_entries.field_report_id AND fr.user_id = auth.uid()));

CREATE POLICY "Users can update their field report entries" 
ON field_report_entries 
FOR UPDATE 
USING (EXISTS ( SELECT 1 FROM field_reports fr WHERE fr.id = field_report_entries.field_report_id AND fr.user_id = auth.uid()));

CREATE POLICY "Users can delete their field report entries" 
ON field_report_entries 
FOR DELETE 
USING (EXISTS ( SELECT 1 FROM field_reports fr WHERE fr.id = field_report_entries.field_report_id AND fr.user_id = auth.uid()));