-- Create user_connection_logs table to support User Activity UI and logging utilities
CREATE TABLE IF NOT EXISTS public.user_connection_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  event text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  method text,
  path text,
  referrer text,
  user_agent text,
  success boolean,
  error_code text,
  error_message text,
  ip text,
  device jsonb,
  metadata jsonb
);

-- Enable RLS
ALTER TABLE public.user_connection_logs ENABLE ROW LEVEL SECURITY;

-- Policies
-- Allow users to insert their own logs
CREATE POLICY IF NOT EXISTS "Users can insert their own connection logs"
ON public.user_connection_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow admins to view all logs
CREATE POLICY IF NOT EXISTS "Admins can view all connection logs"
ON public.user_connection_logs
FOR SELECT
TO authenticated
USING (public.get_current_app_role() = 'admin');

-- Allow users to view their own logs
CREATE POLICY IF NOT EXISTS "Users can view their own connection logs"
ON public.user_connection_logs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_user_connection_logs_user_created_at
  ON public.user_connection_logs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_connection_logs_event_created_at
  ON public.user_connection_logs (event, created_at DESC);
