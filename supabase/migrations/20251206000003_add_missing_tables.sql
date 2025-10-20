-- ============================================================================
-- ADD MISSING TABLES - Complete the schema with remaining tables
-- ============================================================================

BEGIN;

-- Waitlist archive
CREATE TABLE IF NOT EXISTS public.waitlist_archive (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'pending',
    referred_by UUID,
    migrated_to_referral_id UUID,
    migrated_at TIMESTAMPTZ
);

-- Category creation log
CREATE TABLE IF NOT EXISTS public.category_creation_log (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    category_name TEXT NOT NULL
);

-- Error logs (if not already created)
CREATE TABLE IF NOT EXISTS public.error_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    error_type TEXT NOT NULL,
    error_message TEXT NOT NULL,
    context JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Outfit recommendations (if not exists)
CREATE TABLE IF NOT EXISTS public.outfit_recommendations (
    id UUID DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    occasion_name TEXT NOT NULL,
    mood_name TEXT,
    weather_condition_name TEXT,
    temperature_celsius INTEGER,
    activity_level_name TEXT,
    destination TEXT,
    time_of_day TEXT,
    event_duration_hours INTEGER,
    season_name TEXT,
    clothing_item_ids UUID[] NOT NULL,
    ai_score DECIMAL(3, 2) CHECK (ai_score >= 0 AND ai_score <= 1),
    style_coherence_score DECIMAL(3, 2),
    weather_appropriateness_score DECIMAL(3, 2),
    occasion_match_score DECIMAL(3, 2),
    missing_items TEXT[],
    suggested_purchases JSONB DEFAULT '[]',
    is_shared BOOLEAN DEFAULT FALSE,
    share_url TEXT,
    virtual_tryon_url TEXT,
    based_on_past_preferences BOOLEAN DEFAULT FALSE,
    similarity_to_past_liked DECIMAL(3, 2),
    recommendation_reason TEXT,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (id, user_id)
) PARTITION BY HASH (user_id);

-- Create partitions for outfit_recommendations
CREATE TABLE IF NOT EXISTS public.outfit_recommendations_p0 PARTITION OF public.outfit_recommendations 
FOR VALUES WITH (MODULUS 2, REMAINDER 0);

CREATE TABLE IF NOT EXISTS public.outfit_recommendations_p1 PARTITION OF public.outfit_recommendations 
FOR VALUES WITH (MODULUS 2, REMAINDER 1);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_waitlist_archive_email ON public.waitlist_archive(email);
CREATE INDEX IF NOT EXISTS idx_category_creation_log_user_time ON public.category_creation_log(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_error_logs_type_time ON public.error_logs(error_type, created_at);
CREATE INDEX IF NOT EXISTS idx_recommendations_user_id ON public.outfit_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_occasion ON public.outfit_recommendations(occasion_name);

-- Enable RLS
ALTER TABLE public.waitlist_archive ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outfit_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS Policies (skip if already exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'outfit_recommendations' AND policyname = 'Users can view own recommendations') THEN
        CREATE POLICY "Users can view own recommendations" ON public.outfit_recommendations 
        FOR SELECT USING ((select auth.uid()) = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'outfit_recommendations' AND policyname = 'Users can insert own recommendations') THEN
        CREATE POLICY "Users can insert own recommendations" ON public.outfit_recommendations 
        FOR INSERT WITH CHECK ((select auth.uid()) = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'error_logs' AND policyname = 'Users can view own errors') THEN
        CREATE POLICY "Users can view own errors" ON public.error_logs 
        FOR SELECT USING ((select auth.uid()) = user_id);
    END IF;
END $$;

-- Seed waitlist data
INSERT INTO public.waitlist_archive (id, email, created_at, status, referred_by) VALUES
('69d2a4c0-13d5-4ca2-acb0-bb9c13f75e7b', 'w.ruzindana@alustudent.com', '2025-05-26 13:30:54.673377+00', 'pending', NULL),
('46c396a9-b139-474a-ac86-8cf13acb6b93', 'davidwampamba@gmail.com', '2025-05-26 16:31:02.651569+00', 'pending', NULL),
('69d35f19-934c-48f1-b298-9d9a7d23334a', 'tetagata@yahoo.fr', '2025-05-28 10:37:33.778656+00', 'pending', NULL)
ON CONFLICT (id) DO NOTHING;

COMMIT;