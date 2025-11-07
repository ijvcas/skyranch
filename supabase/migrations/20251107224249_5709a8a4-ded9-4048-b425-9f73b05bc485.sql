-- Create financial-receipts storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('financial-receipts', 'financial-receipts', false)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for financial-receipts bucket
CREATE POLICY "Users can view their own receipts"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'financial-receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own receipts"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'financial-receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own receipts"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'financial-receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own receipts"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'financial-receipts' AND auth.uid()::text = (storage.foldername(name))[1]);