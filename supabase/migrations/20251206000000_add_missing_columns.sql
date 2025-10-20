-- Add missing columns to existing tables
BEGIN;

-- Add missing columns to user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS height_cm INTEGER CHECK (height_cm > 0 AND height_cm < 300),
ADD COLUMN IF NOT EXISTS weight_kg DECIMAL(5, 2) CHECK (weight_kg > 0),
ADD COLUMN IF NOT EXISTS style_preferences TEXT[],
ADD COLUMN IF NOT EXISTS color_preferences TEXT[],
ADD COLUMN IF NOT EXISTS cultural_preferences JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS profile_image_url TEXT,
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS monthly_tryons_used INTEGER DEFAULT 0;

-- Add missing columns to clothing_items
ALTER TABLE public.clothing_items 
ADD COLUMN IF NOT EXISTS material TEXT[],
ADD COLUMN IF NOT EXISTS pattern TEXT,
ADD COLUMN IF NOT EXISTS embedding VECTOR(768),
ADD COLUMN IF NOT EXISTS ai_confidence_score DECIMAL(3, 2) CHECK (ai_confidence_score >= 0 AND ai_confidence_score <= 1),
ADD COLUMN IF NOT EXISTS ai_metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS is_eco_friendly BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS care_instructions TEXT,
ADD COLUMN IF NOT EXISTS purchase_date DATE;

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_clothing_embedding ON public.clothing_items USING ivfflat(embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_clothing_material ON public.clothing_items USING GIN(material);
CREATE INDEX IF NOT EXISTS idx_user_profiles_onboarding ON public.user_profiles(onboarding_completed);

COMMIT;