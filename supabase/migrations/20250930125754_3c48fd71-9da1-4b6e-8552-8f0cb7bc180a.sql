-- Add weather context toggle to AI settings
ALTER TABLE public.ai_settings 
ADD COLUMN IF NOT EXISTS enable_weather_context boolean DEFAULT true;