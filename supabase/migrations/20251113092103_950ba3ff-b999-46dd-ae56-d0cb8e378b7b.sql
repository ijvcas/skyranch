-- Fix increment_product_scan_count to include search_path protection
CREATE OR REPLACE FUNCTION public.increment_product_scan_count(product_barcode text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE universal_products
  SET scan_count = scan_count + 1,
      last_scanned_at = NOW()
  WHERE barcode = product_barcode;
END;
$function$;

-- Fix initialize_user_subscription to include search_path protection
CREATE OR REPLACE FUNCTION public.initialize_user_subscription()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.subscriptions (user_id, tier, status)
  VALUES (NEW.id, 'free', 'active')
  ON CONFLICT (user_id) DO NOTHING;
  
  INSERT INTO public.subscription_usage (user_id, animals_count, users_count)
  VALUES (NEW.id, 0, 1)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$function$;