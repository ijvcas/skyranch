
-- 1) Create table (idempotent) with schema that matches the app's logger
CREATE TABLE IF NOT EXISTS public.user_connection_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  event text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  method text,
  path text,
  referrer text,
  user_agent text,
  ip text,
  device text,               -- must be text (app sends a string)
  os text,                   -- required by logger
  browser text,              -- required by logger
  success boolean,
  error_code text,
  error_message text,
  metadata jsonb
);

-- 2) If the table already existed with a different device type, coerce it to text
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_connection_logs'
      AND column_name = 'device'
      AND data_type IN ('json', 'jsonb')
  ) THEN
    ALTER TABLE public.user_connection_logs
      ALTER COLUMN device TYPE text USING device::text;
  END IF;
END $$;

-- 3) Ensure missing columns exist (safe if already present)
ALTER TABLE public.user_connection_logs
  ADD COLUMN IF NOT EXISTS os text,
  ADD COLUMN IF NOT EXISTS browser text,
  ADD COLUMN IF NOT EXISTS ip text,
  ADD COLUMN IF NOT EXISTS metadata jsonb;

-- 4) Enable RLS
ALTER TABLE public.user_connection_logs ENABLE ROW LEVEL SECURITY;

-- 5) Recreate policies reliably (drop-if-exists, then create)
DROP POLICY IF EXISTS "Users can insert their own connection logs" ON public.user_connection_logs;
CREATE POLICY "Users can insert their own connection logs"
ON public.user_connection_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own connection logs" ON public.user_connection_logs;
CREATE POLICY "Users can view their own connection logs"
ON public.user_connection_logs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all connection logs" ON public.user_connection_logs;
CREATE POLICY "Admins can view all connection logs"
ON public.user_connection_logs
FOR SELECT
TO authenticated
USING (public.get_current_app_role() = 'admin');

-- 6) Helpful indexes
CREATE INDEX IF NOT EXISTS idx_ucl_user_created_at
  ON public.user_connection_logs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ucl_event_created_at
  ON public.user_connection_logs (event, created_at DESC);
