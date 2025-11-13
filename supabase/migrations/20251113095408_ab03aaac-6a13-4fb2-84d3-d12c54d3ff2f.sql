-- Make farm storage buckets public for easy image access
-- RLS policies will still control who can upload/update/delete

UPDATE storage.buckets
SET public = true
WHERE id IN ('farm-logos', 'farm-pictures');