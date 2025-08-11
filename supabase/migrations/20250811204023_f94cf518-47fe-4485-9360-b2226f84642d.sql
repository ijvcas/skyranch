-- Add grazing lifecycle columns to lots table
ALTER TABLE public.lots
  ADD COLUMN IF NOT EXISTS grazing_start_date DATE,
  ADD COLUMN IF NOT EXISTS last_grazing_end_date DATE,
  ADD COLUMN IF NOT EXISTS max_grazing_days INTEGER DEFAULT 15,
  ADD COLUMN IF NOT EXISTS rest_days_required INTEGER DEFAULT 30;

-- Optional comments for documentation
COMMENT ON COLUMN public.lots.grazing_start_date IS 'Fecha de inicio del pastoreo actual (YYYY-MM-DD)';
COMMENT ON COLUMN public.lots.last_grazing_end_date IS 'Fecha de fin del último pastoreo (YYYY-MM-DD)';
COMMENT ON COLUMN public.lots.max_grazing_days IS 'Días máximos de pastoreo (base, por defecto 15)';
COMMENT ON COLUMN public.lots.rest_days_required IS 'Días de descanso requeridos después del pastoreo (por defecto 30)';