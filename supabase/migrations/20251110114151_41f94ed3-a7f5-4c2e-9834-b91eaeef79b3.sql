-- Create tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('feeding', 'health', 'maintenance', 'breeding', 'custom')),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  due_date TIMESTAMP WITH TIME ZONE,
  assigned_to UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  animal_id UUID REFERENCES public.animals(id) ON DELETE SET NULL,
  lot_id UUID REFERENCES public.lots(id) ON DELETE SET NULL,
  notes TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create inventory_items table
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('feed', 'medicine', 'supplement', 'equipment', 'other')),
  unit TEXT NOT NULL,
  current_quantity NUMERIC NOT NULL DEFAULT 0,
  min_quantity NUMERIC,
  max_quantity NUMERIC,
  unit_cost NUMERIC,
  barcode TEXT,
  supplier TEXT,
  storage_location TEXT,
  expiry_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create inventory_transactions table
CREATE TABLE IF NOT EXISTS public.inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'usage', 'waste', 'adjustment')),
  quantity NUMERIC NOT NULL,
  unit_cost NUMERIC,
  total_cost NUMERIC,
  notes TEXT,
  animal_id UUID REFERENCES public.animals(id) ON DELETE SET NULL,
  transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_inventory_items_user_id ON public.inventory_items(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_barcode ON public.inventory_items(barcode);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_item_id ON public.inventory_transactions(item_id);

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can create their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can view their own inventory" ON public.inventory_items;
DROP POLICY IF EXISTS "Users can create inventory items" ON public.inventory_items;
DROP POLICY IF EXISTS "Users can update their own inventory" ON public.inventory_items;
DROP POLICY IF EXISTS "Users can delete their own inventory" ON public.inventory_items;
DROP POLICY IF EXISTS "Users can view transactions for their inventory" ON public.inventory_transactions;
DROP POLICY IF EXISTS "Users can create transactions for their inventory" ON public.inventory_transactions;

-- RLS Policies for tasks
CREATE POLICY "Users can view their own tasks" ON public.tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tasks" ON public.tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks" ON public.tasks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks" ON public.tasks
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for inventory_items
CREATE POLICY "Users can view their own inventory" ON public.inventory_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create inventory items" ON public.inventory_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own inventory" ON public.inventory_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own inventory" ON public.inventory_items
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for inventory_transactions
CREATE POLICY "Users can view transactions for their inventory" ON public.inventory_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.inventory_items 
      WHERE id = inventory_transactions.item_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create transactions for their inventory" ON public.inventory_transactions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.inventory_items 
      WHERE id = inventory_transactions.item_id 
      AND user_id = auth.uid()
    )
  );

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks;
DROP TRIGGER IF EXISTS update_inventory_items_updated_at ON public.inventory_items;
DROP TRIGGER IF EXISTS update_inventory_on_transaction ON public.inventory_transactions;

-- Triggers for updated_at
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inventory_items_updated_at
  BEFORE UPDATE ON public.inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update inventory quantity after transaction
CREATE OR REPLACE FUNCTION update_inventory_quantity()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_inventory_on_transaction
  AFTER INSERT ON public.inventory_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_quantity();