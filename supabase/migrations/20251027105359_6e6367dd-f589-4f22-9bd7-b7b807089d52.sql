-- Allow users to create their own farm profile
CREATE POLICY "Users can create their own farm profile"
ON public.farm_profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by OR auth.uid() = owner_user_id);

-- Allow users to update their own farm profile
CREATE POLICY "Users can update their own farm profile"
ON public.farm_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = owner_user_id OR auth.uid() = created_by)
WITH CHECK (auth.uid() = owner_user_id OR auth.uid() = created_by);

-- Allow admins to update any farm profile
CREATE POLICY "Admins can update any farm profile"
ON public.farm_profiles
FOR UPDATE
TO authenticated
USING (get_current_app_role() = 'admin')
WITH CHECK (get_current_app_role() = 'admin');