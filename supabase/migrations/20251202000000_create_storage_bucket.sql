-- ============================================================================
-- CREATE STORAGE BUCKET FOR CLOTHING IMAGES
-- ============================================================================

-- Create storage bucket for clothing images
INSERT INTO storage.buckets (id, name, public)
VALUES ('clothing', 'clothing', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: Users can upload to their own folder
CREATE POLICY "Users can upload own clothing images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'clothing' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Storage policy: Users can read their own images
CREATE POLICY "Users can view own clothing images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'clothing' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Storage policy: Users can update their own images
CREATE POLICY "Users can update own clothing images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'clothing' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Storage policy: Users can delete their own images
CREATE POLICY "Users can delete own clothing images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'clothing' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);