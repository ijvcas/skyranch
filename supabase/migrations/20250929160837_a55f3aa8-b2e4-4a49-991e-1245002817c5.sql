-- Create animal sales table
CREATE TABLE public.animal_sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  animal_id UUID NOT NULL,
  sale_date DATE NOT NULL,
  sale_price NUMERIC NOT NULL CHECK (sale_price > 0),
  buyer_name TEXT NOT NULL,
  buyer_contact TEXT,
  buyer_email TEXT,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  total_amount NUMERIC NOT NULL CHECK (total_amount > 0),
  amount_paid NUMERIC NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
  amount_pending NUMERIC GENERATED ALWAYS AS (total_amount - amount_paid) STORED,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('paid', 'partial', 'pending')),
  sale_notes TEXT,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sale payments table for partial payments
CREATE TABLE public.sale_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id UUID NOT NULL,
  payment_date DATE NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL,
  reference_number TEXT,
  notes TEXT,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create farm ledger table for financial transactions
CREATE TABLE public.farm_ledger (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('sale', 'payment', 'expense', 'income')),
  reference_id UUID, -- References sale_id for sales, other IDs for other transaction types
  reference_type TEXT, -- 'animal_sale', 'health_record', 'breeding_record', etc.
  amount NUMERIC NOT NULL,
  description TEXT NOT NULL,
  transaction_date DATE NOT NULL,
  user_id UUID NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add sale_id to animals table
ALTER TABLE public.animals 
ADD COLUMN sale_id UUID REFERENCES public.animal_sales(id);

-- Enable RLS on new tables
ALTER TABLE public.animal_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farm_ledger ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for animal_sales
CREATE POLICY "Active users can view all animal sales" 
ON public.animal_sales 
FOR SELECT 
USING ((auth.uid() IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM app_users
  WHERE ((app_users.id = auth.uid()) AND (app_users.is_active = true)))));

CREATE POLICY "Active users can insert animal sales" 
ON public.animal_sales 
FOR INSERT 
WITH CHECK ((auth.uid() IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM app_users
  WHERE ((app_users.id = auth.uid()) AND (app_users.is_active = true)))) AND (user_id = auth.uid()));

CREATE POLICY "Active users can update all animal sales" 
ON public.animal_sales 
FOR UPDATE 
USING ((auth.uid() IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM app_users
  WHERE ((app_users.id = auth.uid()) AND (app_users.is_active = true)))));

CREATE POLICY "Active users can delete all animal sales" 
ON public.animal_sales 
FOR DELETE 
USING ((auth.uid() IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM app_users
  WHERE ((app_users.id = auth.uid()) AND (app_users.is_active = true)))));

-- Create RLS policies for sale_payments
CREATE POLICY "Active users can view all sale payments" 
ON public.sale_payments 
FOR SELECT 
USING ((auth.uid() IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM app_users
  WHERE ((app_users.id = auth.uid()) AND (app_users.is_active = true)))));

CREATE POLICY "Active users can insert sale payments" 
ON public.sale_payments 
FOR INSERT 
WITH CHECK ((auth.uid() IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM app_users
  WHERE ((app_users.id = auth.uid()) AND (app_users.is_active = true)))) AND (user_id = auth.uid()));

CREATE POLICY "Active users can update all sale payments" 
ON public.sale_payments 
FOR UPDATE 
USING ((auth.uid() IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM app_users
  WHERE ((app_users.id = auth.uid()) AND (app_users.is_active = true)))));

CREATE POLICY "Active users can delete all sale payments" 
ON public.sale_payments 
FOR DELETE 
USING ((auth.uid() IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM app_users
  WHERE ((app_users.id = auth.uid()) AND (app_users.is_active = true)))));

-- Create RLS policies for farm_ledger
CREATE POLICY "Active users can view all farm ledger entries" 
ON public.farm_ledger 
FOR SELECT 
USING ((auth.uid() IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM app_users
  WHERE ((app_users.id = auth.uid()) AND (app_users.is_active = true)))));

CREATE POLICY "Active users can insert farm ledger entries" 
ON public.farm_ledger 
FOR INSERT 
WITH CHECK ((auth.uid() IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM app_users
  WHERE ((app_users.id = auth.uid()) AND (app_users.is_active = true)))) AND (user_id = auth.uid()));

CREATE POLICY "Active users can update all farm ledger entries" 
ON public.farm_ledger 
FOR UPDATE 
USING ((auth.uid() IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM app_users
  WHERE ((app_users.id = auth.uid()) AND (app_users.is_active = true)))));

CREATE POLICY "Active users can delete all farm ledger entries" 
ON public.farm_ledger 
FOR DELETE 
USING ((auth.uid() IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM app_users
  WHERE ((app_users.id = auth.uid()) AND (app_users.is_active = true)))));

-- Create function to update sale payment status
CREATE OR REPLACE FUNCTION public.update_sale_payment_status()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic payment status updates
CREATE TRIGGER update_sale_payment_status_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.sale_payments
FOR EACH ROW
EXECUTE FUNCTION public.update_sale_payment_status();

-- Create function to update amount_paid based on payments
CREATE OR REPLACE FUNCTION public.update_sale_amount_paid()
RETURNS TRIGGER AS $$
DECLARE
  sale_total NUMERIC;
BEGIN
  -- Recalculate total amount paid for the sale
  SELECT COALESCE(SUM(amount), 0) INTO sale_total
  FROM public.sale_payments 
  WHERE sale_id = COALESCE(NEW.sale_id, OLD.sale_id);
  
  -- Update the animal_sales record
  UPDATE public.animal_sales 
  SET amount_paid = sale_total
  WHERE id = COALESCE(NEW.sale_id, OLD.sale_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic amount_paid updates
CREATE TRIGGER update_sale_amount_paid_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.sale_payments
FOR EACH ROW
EXECUTE FUNCTION public.update_sale_amount_paid();

-- Add indexes for performance
CREATE INDEX idx_animal_sales_animal_id ON public.animal_sales(animal_id);
CREATE INDEX idx_animal_sales_user_id ON public.animal_sales(user_id);
CREATE INDEX idx_animal_sales_sale_date ON public.animal_sales(sale_date);
CREATE INDEX idx_sale_payments_sale_id ON public.sale_payments(sale_id);
CREATE INDEX idx_farm_ledger_user_id ON public.farm_ledger(user_id);
CREATE INDEX idx_farm_ledger_transaction_date ON public.farm_ledger(transaction_date);
CREATE INDEX idx_farm_ledger_reference ON public.farm_ledger(reference_id, reference_type);