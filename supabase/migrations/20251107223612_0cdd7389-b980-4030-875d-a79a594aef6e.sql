-- Enhance farm_ledger table with new columns
ALTER TABLE public.farm_ledger 
ADD COLUMN IF NOT EXISTS category text,
ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'cash',
ADD COLUMN IF NOT EXISTS receipt_url text,
ADD COLUMN IF NOT EXISTS tags text[];

-- Create expense_categories table
CREATE TABLE IF NOT EXISTS public.expense_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  icon text,
  color text,
  is_default boolean DEFAULT false,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create financial_budgets table
CREATE TABLE IF NOT EXISTS public.financial_budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  budget_amount numeric NOT NULL CHECK (budget_amount >= 0),
  period_type text NOT NULL CHECK (period_type IN ('monthly', 'yearly')),
  year integer NOT NULL,
  month integer CHECK (month BETWEEN 1 AND 12),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_budgets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for expense_categories
CREATE POLICY "Users can view their own categories"
  ON public.expense_categories FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can create their own categories"
  ON public.expense_categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories"
  ON public.expense_categories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories"
  ON public.expense_categories FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for financial_budgets
CREATE POLICY "Users can view their own budgets"
  ON public.financial_budgets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own budgets"
  ON public.financial_budgets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own budgets"
  ON public.financial_budgets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own budgets"
  ON public.financial_budgets FOR DELETE
  USING (auth.uid() = user_id);

-- Add updated_at triggers
CREATE TRIGGER update_expense_categories_updated_at
  BEFORE UPDATE ON public.expense_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_financial_budgets_updated_at
  BEFORE UPDATE ON public.financial_budgets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default expense categories
INSERT INTO public.expense_categories (name, type, icon, color, is_default, user_id) VALUES
('Alimentación', 'expense', 'Wheat', '#ef4444', true, NULL),
('Veterinario', 'expense', 'Stethoscope', '#3b82f6', true, NULL),
('Equipo', 'expense', 'Wrench', '#8b5cf6', true, NULL),
('Mano de obra', 'expense', 'Users', '#f59e0b', true, NULL),
('Tierra', 'expense', 'MapPin', '#10b981', true, NULL),
('Servicios', 'expense', 'Zap', '#06b6d4', true, NULL),
('Transporte', 'expense', 'Truck', '#6366f1', true, NULL),
('Reproducción', 'expense', 'Heart', '#ec4899', true, NULL),
('Venta de animales', 'income', 'DollarSign', '#22c55e', true, NULL),
('Otros ingresos', 'income', 'TrendingUp', '#14b8a6', true, NULL),
('Otros gastos', 'expense', 'Minus', '#64748b', true, NULL)
ON CONFLICT DO NOTHING;

-- Add language preference to app_users
ALTER TABLE public.app_users
ADD COLUMN IF NOT EXISTS preferred_language text DEFAULT 'es' CHECK (preferred_language IN ('es', 'en', 'pt', 'fr'));