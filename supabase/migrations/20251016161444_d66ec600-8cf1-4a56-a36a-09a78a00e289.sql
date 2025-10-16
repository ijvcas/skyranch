-- Drop the existing restrictive policy that's causing the issue
DROP POLICY IF EXISTS "Active users can insert animal attachments" ON animal_attachments;

-- Create a new policy that allows users to insert attachments for animals they own
CREATE POLICY "Users can insert attachments for their animals"
ON animal_attachments
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM animals
    WHERE animals.id = animal_attachments.animal_id
    AND animals.user_id = auth.uid()
  )
);