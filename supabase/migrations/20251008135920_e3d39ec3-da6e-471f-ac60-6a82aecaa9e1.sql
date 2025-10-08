-- Add RLS policies to chat_history table to allow users to see and send messages

-- Allow users to read their own chat messages
CREATE POLICY "Users can read own messages"
ON public.chat_history
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to insert their own chat messages
CREATE POLICY "Users can insert own messages"
ON public.chat_history
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);