-- Backfill existing health record costs into farm_ledger
-- This ensures historical veterinary costs are properly recorded

INSERT INTO public.farm_ledger (user_id, transaction_type, amount, transaction_date, description, reference_type, metadata)
SELECT 
  hr.user_id,
  'expense' as transaction_type,
  hr.cost as amount,
  hr.date_administered as transaction_date,
  'Gasto Veterinario: ' || hr.title as description,
  'health_record' as reference_type,
  jsonb_build_object(
    'record_type', hr.record_type,
    'veterinarian', hr.veterinarian,
    'medication', hr.medication,
    'animal_id', hr.animal_id,
    'backfilled', true
  ) as metadata
FROM public.health_records hr
WHERE hr.cost IS NOT NULL 
  AND hr.cost > 0
  AND NOT EXISTS (
    SELECT 1 
    FROM public.farm_ledger fl 
    WHERE fl.reference_type = 'health_record' 
      AND fl.user_id = hr.user_id
      AND fl.amount = hr.cost
      AND fl.transaction_date = hr.date_administered
      AND fl.description = 'Gasto Veterinario: ' || hr.title
  );