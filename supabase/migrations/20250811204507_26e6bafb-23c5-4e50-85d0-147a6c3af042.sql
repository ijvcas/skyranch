-- Fix visibility by making property lots per-user and setting user_id
CREATE OR REPLACE FUNCTION public.create_lots_from_propiedad_parcels()
RETURNS TABLE(lots_created integer, lots_deleted integer, success boolean, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  parcel_record record;
  lots_created_count integer := 0;
  lots_deleted_count integer := 0;
  new_lot_uuid uuid;
  cleanup_record record;
  current_user_id uuid := auth.uid();
BEGIN
  IF current_user_id IS NULL THEN
    lots_created := 0;
    lots_deleted := 0;
    success := false;
    message := 'No authenticated user';
    RETURN NEXT;
    RETURN;
  END IF;

  -- Clean up this user's auto-generated property lots that are no longer PROPIEDAD
  FOR cleanup_record IN 
    SELECT l.id
    FROM public.lots l
    LEFT JOIN public.cadastral_parcels cp ON l.source_parcel_id = cp.id
    WHERE l.auto_generated = true 
      AND l.user_id = current_user_id
      AND (cp.id IS NULL OR cp.status <> 'PROPIEDAD')
  LOOP
    DELETE FROM public.lot_polygons WHERE lot_id = cleanup_record.id;
    DELETE FROM public.lots WHERE id = cleanup_record.id;
    lots_deleted_count := lots_deleted_count + 1;
  END LOOP;

  -- Create this user's lots for PROPIEDAD parcels that they don't have yet
  FOR parcel_record IN 
    SELECT cp.id, cp.parcel_id, cp.display_name, cp.lot_number, cp.boundary_coordinates, cp.area_hectares
    FROM public.cadastral_parcels cp
    WHERE cp.status = 'PROPIEDAD'
      AND cp.boundary_coordinates IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM public.lots l 
        WHERE l.source_parcel_id = cp.id 
          AND l.auto_generated = true
          AND l.user_id = current_user_id
      )
  LOOP
    INSERT INTO public.lots (
      user_id, name, description, size_hectares, status, grass_condition, source_parcel_id, auto_generated, lot_type
    ) VALUES (
      current_user_id,
      CASE 
        WHEN parcel_record.lot_number IS NOT NULL AND parcel_record.lot_number <> '' 
        THEN 'Lote ' || parcel_record.lot_number
        ELSE COALESCE(parcel_record.display_name, 'Lote ' || parcel_record.parcel_id)
      END,
      'Generado automáticamente desde parcela catastral ' || parcel_record.parcel_id,
      parcel_record.area_hectares,
      'active',
      'good',
      parcel_record.id,
      true,
      'property'
    ) RETURNING id INTO new_lot_uuid;
    
    INSERT INTO public.lot_polygons (lot_id, coordinates, area_hectares)
    VALUES (new_lot_uuid, parcel_record.boundary_coordinates, parcel_record.area_hectares);
    
    lots_created_count := lots_created_count + 1;
  END LOOP;

  lots_created := lots_created_count;
  lots_deleted := lots_deleted_count;
  success := true;
  message := 'Sincronización completada: ' || lots_created_count || ' lotes creados, ' || lots_deleted_count || ' lotes eliminados';
  RETURN NEXT;
END;
$function$;