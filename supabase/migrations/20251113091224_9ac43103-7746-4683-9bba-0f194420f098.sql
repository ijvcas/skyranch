-- Fix database functions missing fixed search_path
-- This prevents potential SQL injection via schema manipulation

-- 1. Fix update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 2. Fix update_subscription_updated_at
CREATE OR REPLACE FUNCTION public.update_subscription_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 3. Fix update_sale_payment_status
CREATE OR REPLACE FUNCTION public.update_sale_payment_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Update payment status based on amount paid
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE public.animal_sales 
    SET 
      payment_status = CASE 
        WHEN amount_paid >= total_amount THEN 'paid'
        WHEN amount_paid > 0 THEN 'partial'
        ELSE 'pending'
      END,
      updated_at = now()
    WHERE id = COALESCE(NEW.sale_id, OLD.sale_id);
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.animal_sales 
    SET 
      payment_status = CASE 
        WHEN amount_paid >= total_amount THEN 'paid'
        WHEN amount_paid > 0 THEN 'partial'
        ELSE 'pending'
      END,
      updated_at = now()
    WHERE id = OLD.sale_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- 4. Fix update_inventory_quantity
CREATE OR REPLACE FUNCTION public.update_inventory_quantity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.type = 'purchase' THEN
    UPDATE public.inventory_items 
    SET current_quantity = current_quantity + NEW.quantity
    WHERE id = NEW.item_id;
  ELSIF NEW.type IN ('usage', 'waste') THEN
    UPDATE public.inventory_items 
    SET current_quantity = current_quantity - NEW.quantity
    WHERE id = NEW.item_id;
  ELSIF NEW.type = 'adjustment' THEN
    UPDATE public.inventory_items 
    SET current_quantity = NEW.quantity
    WHERE id = NEW.item_id;
  END IF;
  RETURN NEW;
END;
$function$;

-- Create table for emergency contacts (replacing localStorage)
CREATE TABLE IF NOT EXISTS public.user_emergency_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  contact_type text NOT NULL CHECK (contact_type IN ('veterinarian', 'emergency')),
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  relationship text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_emergency_contacts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own emergency contacts"
ON public.user_emergency_contacts
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own emergency contacts"
ON public.user_emergency_contacts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own emergency contacts"
ON public.user_emergency_contacts
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own emergency contacts"
ON public.user_emergency_contacts
FOR DELETE
USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER update_user_emergency_contacts_updated_at
  BEFORE UPDATE ON public.user_emergency_contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();