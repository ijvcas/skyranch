-- Function to check if current user is active in app_users
CREATE OR REPLACE FUNCTION public.is_active_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  select coalesce(
    (select is_active from public.app_users where id = auth.uid() limit 1),
    false
  );
$$;

-- RLS policy to allow active authenticated users to view all animals
DROP POLICY IF EXISTS "Active users can view animals" ON public.animals;
CREATE POLICY "Active users can view animals"
ON public.animals
FOR SELECT
TO authenticated
USING (public.is_active_user());