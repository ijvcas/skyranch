-- Create weather forecasts table for caching forecast data
CREATE TABLE IF NOT EXISTS public.weather_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_key TEXT NOT NULL,
  forecast_type TEXT NOT NULL CHECK (forecast_type IN ('hourly', 'daily')),
  forecast_data JSONB NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_weather_forecasts_location ON public.weather_forecasts(location_key);
CREATE INDEX idx_weather_forecasts_expires ON public.weather_forecasts(expires_at);

-- Enable RLS
ALTER TABLE public.weather_forecasts ENABLE ROW LEVEL SECURITY;

-- Public read access (weather data is not sensitive)
CREATE POLICY "Anyone can read weather forecasts"
ON public.weather_forecasts FOR SELECT
USING (true);

-- Service role can manage forecasts
CREATE POLICY "Service role can manage forecasts"
ON public.weather_forecasts FOR ALL
USING (auth.role() = 'service_role');

-- Enhance weather_automation_rules with forecast support
ALTER TABLE public.weather_automation_rules
ADD COLUMN IF NOT EXISTS forecast_hours INTEGER DEFAULT NULL;

COMMENT ON COLUMN public.weather_automation_rules.forecast_hours IS 'NULL = current conditions, >0 = check forecast X hours ahead';

-- Add cleanup function for expired forecasts
CREATE OR REPLACE FUNCTION public.cleanup_expired_forecasts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.weather_forecasts
  WHERE expires_at < now() - INTERVAL '1 day';
END;
$$;