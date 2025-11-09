-- Task Management Tables
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT NOT NULL,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'pending',
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  assigned_to UUID,
  animal_ids UUID[],
  lot_id UUID,
  recurring BOOLEAN DEFAULT false,
  recurrence_pattern TEXT,
  recurrence_end_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.task_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inventory Management Tables
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  unit TEXT NOT NULL,
  current_quantity NUMERIC DEFAULT 0,
  min_quantity NUMERIC DEFAULT 0,
  max_quantity NUMERIC,
  unit_cost NUMERIC,
  supplier TEXT,
  barcode TEXT UNIQUE,
  storage_location TEXT,
  expiry_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  unit_cost NUMERIC,
  total_cost NUMERIC,
  reference_type TEXT,
  reference_id UUID,
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.inventory_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  acknowledged_by UUID
);

-- Weather Automation Tables
CREATE TABLE IF NOT EXISTS public.weather_automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  rule_type TEXT NOT NULL,
  condition TEXT NOT NULL,
  threshold NUMERIC NOT NULL,
  action_type TEXT NOT NULL,
  action_config JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.weather_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  message TEXT NOT NULL,
  weather_data JSONB,
  acknowledged BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weather_automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weather_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Tasks
CREATE POLICY "Active users can view all tasks" ON public.tasks
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND 
    EXISTS (SELECT 1 FROM public.app_users WHERE id = auth.uid() AND is_active = true)
  );

CREATE POLICY "Active users can insert tasks" ON public.tasks
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND 
    EXISTS (SELECT 1 FROM public.app_users WHERE id = auth.uid() AND is_active = true) AND
    user_id = auth.uid()
  );

CREATE POLICY "Active users can update all tasks" ON public.tasks
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND 
    EXISTS (SELECT 1 FROM public.app_users WHERE id = auth.uid() AND is_active = true)
  );

CREATE POLICY "Managers and admins can delete tasks" ON public.tasks
  FOR DELETE USING (
    auth.uid() IS NOT NULL AND 
    get_current_app_role() IN ('admin', 'manager')
  );

-- RLS Policies for Task Comments
CREATE POLICY "Active users can view task comments" ON public.task_comments
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND 
    EXISTS (SELECT 1 FROM public.app_users WHERE id = auth.uid() AND is_active = true)
  );

CREATE POLICY "Active users can insert task comments" ON public.task_comments
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND 
    EXISTS (SELECT 1 FROM public.app_users WHERE id = auth.uid() AND is_active = true) AND
    user_id = auth.uid()
  );

-- RLS Policies for Task Attachments
CREATE POLICY "Active users can view task attachments" ON public.task_attachments
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND 
    EXISTS (SELECT 1 FROM public.app_users WHERE id = auth.uid() AND is_active = true)
  );

CREATE POLICY "Active users can insert task attachments" ON public.task_attachments
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND 
    EXISTS (SELECT 1 FROM public.app_users WHERE id = auth.uid() AND is_active = true) AND
    uploaded_by = auth.uid()
  );

-- RLS Policies for Inventory Items
CREATE POLICY "Active users can view all inventory items" ON public.inventory_items
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND 
    EXISTS (SELECT 1 FROM public.app_users WHERE id = auth.uid() AND is_active = true)
  );

CREATE POLICY "Active users can insert inventory items" ON public.inventory_items
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND 
    EXISTS (SELECT 1 FROM public.app_users WHERE id = auth.uid() AND is_active = true) AND
    user_id = auth.uid()
  );

CREATE POLICY "Active users can update all inventory items" ON public.inventory_items
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND 
    EXISTS (SELECT 1 FROM public.app_users WHERE id = auth.uid() AND is_active = true)
  );

CREATE POLICY "Managers and admins can delete inventory items" ON public.inventory_items
  FOR DELETE USING (
    auth.uid() IS NOT NULL AND 
    get_current_app_role() IN ('admin', 'manager')
  );

-- RLS Policies for Inventory Transactions
CREATE POLICY "Active users can view inventory transactions" ON public.inventory_transactions
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND 
    EXISTS (SELECT 1 FROM public.app_users WHERE id = auth.uid() AND is_active = true)
  );

CREATE POLICY "Active users can insert inventory transactions" ON public.inventory_transactions
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND 
    EXISTS (SELECT 1 FROM public.app_users WHERE id = auth.uid() AND is_active = true) AND
    created_by = auth.uid()
  );

-- RLS Policies for Inventory Alerts
CREATE POLICY "Active users can view inventory alerts" ON public.inventory_alerts
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND 
    EXISTS (SELECT 1 FROM public.app_users WHERE id = auth.uid() AND is_active = true)
  );

CREATE POLICY "Active users can update inventory alerts" ON public.inventory_alerts
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND 
    EXISTS (SELECT 1 FROM public.app_users WHERE id = auth.uid() AND is_active = true)
  );

-- RLS Policies for Weather Automation Rules
CREATE POLICY "Active users can view weather rules" ON public.weather_automation_rules
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Active users can insert weather rules" ON public.weather_automation_rules
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Active users can update weather rules" ON public.weather_automation_rules
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Active users can delete weather rules" ON public.weather_automation_rules
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for Weather Alerts
CREATE POLICY "Active users can view weather alerts" ON public.weather_alerts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Active users can update weather alerts" ON public.weather_alerts
  FOR UPDATE USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON public.inventory_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();