-- Enable real-time updates for calendar_events table
-- This allows the frontend to receive immediate updates when events are created, updated, or deleted

-- Set replica identity to FULL to capture all column data in real-time updates
ALTER TABLE public.calendar_events REPLICA IDENTITY FULL;

-- Add table to the realtime publication so changes are broadcast
ALTER PUBLICATION supabase_realtime ADD TABLE public.calendar_events;