-- Create helper functions for push token management

-- Function to upsert push token
CREATE OR REPLACE FUNCTION public.upsert_push_token(
  p_user_id UUID,
  p_token TEXT,
  p_platform TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.push_tokens (user_id, token, platform, updated_at)
  VALUES (p_user_id, p_token, p_platform, NOW())
  ON CONFLICT (user_id, token)
  DO UPDATE SET
    platform = EXCLUDED.platform,
    updated_at = EXCLUDED.updated_at;
END;
$$;

-- Function to delete push token
CREATE OR REPLACE FUNCTION public.delete_push_token(
  p_user_id UUID,
  p_token TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.push_tokens
  WHERE user_id = p_user_id AND token = p_token;
END;
$$;