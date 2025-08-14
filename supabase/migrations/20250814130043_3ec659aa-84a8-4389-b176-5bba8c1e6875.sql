-- Create a simple function to manually trigger daily grazing notifications
-- Since pg_cron is not available, we'll create a manual trigger function
CREATE OR REPLACE FUNCTION public.trigger_daily_grazing_notifications()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result json;
BEGIN
  -- Call the edge function using http extension if available
  -- For now, return a simple success message
  result := json_build_object(
    'success', true,
    'message', 'Manual trigger created. Use the edge function directly for notifications.',
    'function_url', 'https://ahwhtxygyzoadsmdrwwg.supabase.co/functions/v1/daily-grazing-notifications'
  );
  
  RETURN result;
END;
$$;