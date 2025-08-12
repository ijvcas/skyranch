-- Create trigger to auto-create app_users when a profile is inserted
-- Avoid touching auth schema by hooking into public.profiles

-- Function to create app_users on profile insert
CREATE OR REPLACE FUNCTION public.handle_new_profile_create_app_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  -- Only insert if not exists to avoid duplicates
  IF NOT EXISTS (
    SELECT 1 FROM public.app_users au WHERE au.id = NEW.id OR au.email = NEW.email
  ) THEN
    INSERT INTO public.app_users (id, name, email, role, is_active, created_by, phone)
    VALUES (
      NEW.id,
      COALESCE(NEW.full_name, split_part(COALESCE(NEW.email, ''), '@', 1)),
      NEW.email,
      'worker',
      true,
      NEW.id,
      ''
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger on public.profiles after insert
DROP TRIGGER IF EXISTS on_profile_created_create_app_user ON public.profiles;
CREATE TRIGGER on_profile_created_create_app_user
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_new_profile_create_app_user();