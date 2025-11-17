-- ============================================================================
-- CREATE STORAGE BUCKETS FOR PROFILE IMAGES
-- ============================================================================

-- Create PUBLIC bucket for profile avatars (can be cached, shared)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Create PRIVATE bucket for virtual try-on photos (sensitive, personal)
INSERT INTO storage.buckets (id, name, public)
VALUES ('tryon', 'tryon', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- AVATARS BUCKET POLICIES (PUBLIC)
-- ============================================================================

-- Users can upload their own avatar
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Anyone can view avatars (public bucket)
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Users can update their own avatar
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete their own avatar
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================================================
-- TRYON BUCKET POLICIES (PRIVATE)
-- ============================================================================

-- Users can upload their own try-on photo
CREATE POLICY "Users can upload own tryon photo"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'tryon' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can ONLY view their own try-on photos (private)
CREATE POLICY "Users can view own tryon photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'tryon' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can update their own try-on photo
CREATE POLICY "Users can update own tryon photo"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'tryon' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete their own try-on photo
CREATE POLICY "Users can delete own tryon photo"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'tryon' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================================================
-- ADD VIRTUAL TRY-ON COLUMN TO USER_PROFILES
-- ============================================================================

-- Add virtual try-on image URL column
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS virtual_tryon_image_url TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_tryon_image ON public.user_profiles(virtual_tryon_image_url) WHERE virtual_tryon_image_url IS NOT NULL;

-- Comment
COMMENT ON COLUMN public.user_profiles.virtual_tryon_image_url IS 'Full-body photo URL for virtual try-on feature';
