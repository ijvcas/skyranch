-- Create AI settings table
CREATE TABLE IF NOT EXISTS public.ai_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  ai_provider text NOT NULL DEFAULT 'lovable',
  system_prompt text DEFAULT 'Eres un asistente experto en gestión de ranchos ganaderos. Ayuda a los usuarios con consultas sobre animales, reproducción, manejo de lotes, y mejores prácticas ganaderas. Responde siempre en español de forma clara y práctica.',
  enable_animal_context boolean DEFAULT true,
  enable_breeding_context boolean DEFAULT true,
  enable_lots_context boolean DEFAULT true,
  usage_limit_per_user integer DEFAULT 100,
  language text DEFAULT 'es'
);

-- Create chat history table
CREATE TABLE IF NOT EXISTS public.chat_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_chat_history_user_id ON public.chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_created_at ON public.chat_history(created_at DESC);

-- Enable RLS
ALTER TABLE public.ai_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;

-- AI Settings policies (admin only)
CREATE POLICY "Admins can view AI settings"
  ON public.ai_settings FOR SELECT
  TO authenticated
  USING (get_current_app_role() = 'admin');

CREATE POLICY "Admins can update AI settings"
  ON public.ai_settings FOR UPDATE
  TO authenticated
  USING (get_current_app_role() = 'admin');

CREATE POLICY "Admins can insert AI settings"
  ON public.ai_settings FOR INSERT
  TO authenticated
  WITH CHECK (get_current_app_role() = 'admin');

-- Chat history policies (users can only see their own)
CREATE POLICY "Users can view their own chat history"
  ON public.chat_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chat messages"
  ON public.chat_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat history"
  ON public.chat_history FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Insert default AI settings
INSERT INTO public.ai_settings (id) VALUES (gen_random_uuid())
ON CONFLICT DO NOTHING;

-- Add trigger for updated_at
CREATE TRIGGER update_ai_settings_updated_at
  BEFORE UPDATE ON public.ai_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();