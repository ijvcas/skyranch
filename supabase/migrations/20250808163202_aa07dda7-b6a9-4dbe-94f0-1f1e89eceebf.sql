-- Create table for global weather settings (city-based)
CREATE TABLE IF NOT EXISTS public.weather_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Original user input (free text)
  location_query TEXT NOT NULL,
  -- Google validated fields
  display_name TEXT NOT NULL,
  place_id TEXT NOT NULL,
  lat NUMERIC NOT NULL,
  lng NUMERIC NOT NULL,
  language TEXT DEFAULT 'es',
  unit_system TEXT DEFAULT 'metric'
);

-- Enable Row Level Security
ALTER TABLE public.weather_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can view the current setting (safe: only city name and coordinates)
CREATE POLICY "Anyone can view weather settings"
ON public.weather_settings
FOR SELECT
USING (true);

-- Authenticated users can manage the setting
CREATE POLICY "Authenticated users can manage weather settings"
ON public.weather_settings
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Maintain updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_weather_settings_updated_at ON public.weather_settings;
CREATE TRIGGER trg_weather_settings_updated_at
BEFORE UPDATE ON public.weather_settings
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();