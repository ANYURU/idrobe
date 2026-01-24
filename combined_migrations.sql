-- Migration: 20251020122942_remote_schema.sql




SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";








ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";














































































































































































ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































RESET ALL;


-- Migration: 20251020125000_remote_schema.sql




-- Migration: 20251020141053_remote_schema.sql




-- Migration: 20251020142338_initial-schema.sql.sql

-- ============================================================================
-- AI-Powered Clothing Recommendation App - PostgreSQL Schema for Supabase
-- Benchmark: Original generated schema with modifications highlighted
-- ============================================================================
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE EXTENSION IF NOT EXISTS "vector";

-- pgvector for AI embeddings
-- ============================================================================
-- ENUM TYPES (for type safety and validation)
-- ============================================================================
CREATE TYPE clothing_category AS ENUM (
    'tops',
    'bottoms',
    'dresses',
    'outerwear',
    'shoes',
    'accessories',
    'bags',
    'jewelry',
    'hats',
    'scarves',
    'belts',
    'eyewear',
    'watches',
    'activewear',
    'swimwear',
    'underwear',
    'sleepwear',
    'formalwear',
    'casualwear'
);

CREATE TYPE clothing_subcategory AS ENUM (
    -- Tops
    't-shirt',
    'blouse',
    'shirt',
    'tank-top',
    'sweater',
    'hoodie',
    'cardigan',
    'polo',
    -- Bottoms
    'jeans',
    'trousers',
    'shorts',
    'skirt',
    'leggings',
    'joggers',
    'chinos',
    -- Dresses
    'maxi-dress',
    'mini-dress',
    'midi-dress',
    'cocktail-dress',
    'sundress',
    -- Outerwear
    'jacket',
    'coat',
    'blazer',
    'parka',
    'vest',
    'raincoat',
    'windbreaker',
    -- Shoes
    'sneakers',
    'boots',
    'sandals',
    'heels',
    'flats',
    'loafers',
    'oxfords',
    'slippers',
    -- Accessories & Others
    'necklace',
    'bracelet',
    'earrings',
    'ring',
    'handbag',
    'backpack',
    'clutch',
    'baseball-cap',
    'beanie',
    'fedora',
    'sunglasses',
    'watch',
    'belt',
    'scarf',
    'tie',
    'bow-tie',
    'gloves',
    'socks',
    'tights'
);

CREATE TYPE season AS ENUM (
    'spring',
    'summer',
    'fall',
    'winter',
    'all-season'
);

CREATE TYPE occasion AS ENUM (
    'casual',
    'work',
    'formal',
    'business-casual',
    'party',
    'wedding',
    'date',
    'sports',
    'outdoor',
    'beach',
    'gym',
    'travel',
    'religious',
    'interview',
    'networking',
    'brunch',
    'dinner',
    'concert',
    'festival',
    'graduation',
    'everyday'
);

CREATE TYPE mood AS ENUM (
    'confident',
    'relaxed',
    'professional',
    'playful',
    'romantic',
    'edgy',
    'elegant',
    'sporty',
    'bohemian',
    'minimalist',
    'bold',
    'comfortable',
    'trendy',
    'classic',
    'creative',
    'adventurous'
);

CREATE TYPE activity_level AS ENUM (
    'sedentary',
    'light',
    'moderate',
    'active',
    'very-active'
);

CREATE TYPE body_type AS ENUM (
    'hourglass',
    'pear',
    'apple',
    'rectangle',
    'inverted-triangle',
    'petite',
    'tall',
    'athletic',
    'plus-size',
    'prefer-not-to-say' -- MODIFICATION: Added 'prefer-not-to-say' for inclusivity
);

CREATE TYPE weather_condition AS ENUM (
    'sunny',
    'cloudy',
    'rainy',
    'snowy',
    'windy',
    'hot',
    'cold',
    'mild',
    'humid',
    'dry',
    'stormy',
    'foggy'
);

CREATE TYPE interaction_type AS ENUM (
    'liked',
    'disliked',
    'worn',
    'skipped',
    'saved',
    'shared'
);

CREATE TYPE fit_preference AS ENUM (
    'tight',
    'fitted',
    'regular',
    'loose',
    'oversized'
);

-- ============================================================================
-- USER PROFILE TABLE
-- ============================================================================
CREATE TABLE public.user_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    body_type body_type DEFAULT 'prefer-not-to-say',
    height_cm INTEGER CHECK (
        height_cm > 0
        AND height_cm < 300
    ),
    weight_kg DECIMAL(5, 2) CHECK (weight_kg > 0),
    preferred_fit fit_preference DEFAULT 'regular',
    style_preferences TEXT [],
    -- e.g., ['minimalist', 'classic', 'bohemian']
    color_preferences TEXT [],
    -- e.g., ['black', 'navy', 'white']
    sustainability_score INTEGER DEFAULT 50 CHECK (
        sustainability_score >= 0
        AND sustainability_score <= 100
    ),
    location_city TEXT,
    location_country TEXT,
    timezone TEXT DEFAULT 'UTC',
    cultural_preferences JSONB DEFAULT '{}',
    -- Flexible for region-specific norms
    default_activity_level activity_level DEFAULT 'moderate',
    profile_image_url TEXT,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CLOTHING ITEMS TABLE
-- ============================================================================
-- MODIFICATION: Added partitioning by user_id for scalability (2 partitions for MVP)
CREATE TABLE public.clothing_items (
    id UUID DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    -- Basic Info
    name TEXT NOT NULL,
    category clothing_category NOT NULL,
    subcategory clothing_subcategory,
    brand TEXT,
    size TEXT,
    -- AI-Extracted Attributes
    primary_color TEXT NOT NULL,
    -- e.g., 'black', 'navy-blue'
    secondary_colors TEXT [],
    -- Additional colors
    material TEXT [],
    -- e.g., ['cotton', 'polyester']
    pattern TEXT,
    -- e.g., 'striped', 'solid', 'floral', 'checkered'
    style_tags TEXT [],
    -- e.g., ['casual', 'vintage', 'minimalist']
    -- Physical Attributes
    fit fit_preference DEFAULT 'regular',
    season season [] DEFAULT '{all-season}',
    weather_suitable weather_condition [] DEFAULT '{}',
    -- Care & Usage
    care_instructions TEXT,
    purchase_date DATE,
    cost DECIMAL(10, 2),
    times_worn INTEGER DEFAULT 0,
    last_worn_date DATE,
    -- Sustainability
    sustainability_score INTEGER CHECK (
        sustainability_score >= 0
        AND sustainability_score <= 100
    ),
    is_eco_friendly BOOLEAN DEFAULT FALSE,
    -- AI Analysis
    ai_confidence_score DECIMAL(3, 2) CHECK (
        ai_confidence_score >= 0
        AND ai_confidence_score <= 1
    ),
    embedding VECTOR(512),
    -- For similarity searches
    ai_metadata JSONB DEFAULT '{}',
    -- Raw AI output, style descriptors
    -- Image Storage
    image_url TEXT NOT NULL,
    -- Supabase Storage path
    thumbnail_url TEXT,
    -- Metadata
    is_favorite BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    notes TEXT,
    deleted_at TIMESTAMPTZ,
    -- MODIFICATION: Added for soft deletes (edge case: recoverability)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (id, user_id)
) PARTITION BY HASH (user_id);

-- Create partitions (2 for MVP)
CREATE TABLE public.clothing_items_p0 PARTITION OF public.clothing_items FOR
VALUES
    WITH (MODULUS 2, REMAINDER 0);

CREATE TABLE public.clothing_items_p1 PARTITION OF public.clothing_items FOR
VALUES
    WITH (MODULUS 2, REMAINDER 1);

-- MODIFICATION: Added UNIQUE constraint on image_url to prevent duplicates
ALTER TABLE
    public.clothing_items
ADD
    CONSTRAINT unique_image_url UNIQUE (image_url, user_id);

-- ============================================================================
-- OUTFIT RECOMMENDATIONS TABLE
-- ============================================================================
-- MODIFICATION: Added partitioning by user_id for scalability (2 partitions for MVP)
CREATE TABLE public.outfit_recommendations (
    id UUID DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    -- Context for Recommendation
    occasion occasion NOT NULL,
    mood mood,
    weather_condition weather_condition,
    temperature_celsius INTEGER,
    activity_level activity_level,
    destination TEXT,
    time_of_day TEXT,
    -- e.g., 'morning', 'afternoon', 'evening', 'night'
    event_duration_hours INTEGER,
    season season,
    -- Outfit Composition (array of clothing_item IDs)
    clothing_item_ids UUID [] NOT NULL,
    -- AI Scoring
    ai_score DECIMAL(3, 2) CHECK (
        ai_score >= 0
        AND ai_score <= 1
    ),
    style_coherence_score DECIMAL(3, 2),
    -- How well items match stylistically
    weather_appropriateness_score DECIMAL(3, 2),
    occasion_match_score DECIMAL(3, 2),
    -- Gap Analysis
    missing_items TEXT [],
    -- e.g., ['belt', 'shoes']
    suggested_purchases JSONB DEFAULT '[]',
    -- Recommendations for missing items
    -- Social & Extensibility
    is_shared BOOLEAN DEFAULT FALSE,
    share_url TEXT,
    virtual_tryon_url TEXT,
    -- Future: link to try-on visualization
    -- Personalization Context
    based_on_past_preferences BOOLEAN DEFAULT FALSE,
    similarity_to_past_liked DECIMAL(3, 2),
    recommendation_reason TEXT,
    -- Human-readable explanation
    -- Metadata
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    -- Optional: time-sensitive recommendations
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (id, user_id)
) PARTITION BY HASH (user_id);

-- Create partitions (2 for MVP)
CREATE TABLE public.outfit_recommendations_p0 PARTITION OF public.outfit_recommendations FOR
VALUES
    WITH (MODULUS 2, REMAINDER 0);

CREATE TABLE public.outfit_recommendations_p1 PARTITION OF public.outfit_recommendations FOR
VALUES
    WITH (MODULUS 2, REMAINDER 1);

-- ============================================================================
-- USER INTERACTIONS TABLE (Feedback Loop)
-- ============================================================================
CREATE TABLE public.user_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recommendation_id UUID,
    clothing_item_id UUID,
    interaction_type interaction_type NOT NULL,
    -- Contextual Feedback
    feedback_text TEXT,
    rating INTEGER CHECK (
        rating >= 1
        AND rating <= 5
    ),
    -- Tracking
    interacted_at TIMESTAMPTZ DEFAULT NOW(),
    -- Constraints: Either recommendation_id or clothing_item_id must be set
    CONSTRAINT check_interaction_target CHECK (
        (
            recommendation_id IS NOT NULL
            AND clothing_item_id IS NULL
        )
        OR (
            recommendation_id IS NULL
            AND clothing_item_id IS NOT NULL
        )
    )
);

-- ============================================================================
-- WARDROBE GAPS TABLE (Identified Missing Items)
-- ============================================================================
CREATE TABLE public.wardrobe_gaps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gap_type TEXT NOT NULL,
    -- e.g., 'missing-category', 'color-variety', 'seasonal'
    category clothing_category,
    subcategory clothing_subcategory,
    description TEXT NOT NULL,
    priority INTEGER DEFAULT 5 CHECK (
        priority >= 1
        AND priority <= 10
    ),
    -- Purchase Suggestions
    suggested_items JSONB DEFAULT '[]',
    -- External product recommendations
    estimated_cost DECIMAL(10, 2),
    -- Status
    is_addressed BOOLEAN DEFAULT FALSE,
    addressed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- OUTFIT COLLECTIONS (Saved/Curated Outfits)
-- ============================================================================
CREATE TABLE public.outfit_collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    clothing_item_ids UUID [] NOT NULL,
    -- Metadata
    is_favorite BOOLEAN DEFAULT FALSE,
    times_worn INTEGER DEFAULT 0,
    last_worn_date DATE,
    -- Social
    is_public BOOLEAN DEFAULT FALSE,
    share_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SEASONAL TRENDS TABLE (Global Fashion Trends)
-- ============================================================================
CREATE TABLE public.seasonal_trends (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    season season NOT NULL,
    year INTEGER NOT NULL,
    trending_colors TEXT [],
    trending_patterns TEXT [],
    trending_styles TEXT [],
    trending_categories clothing_category [],
    trend_description TEXT,
    source TEXT,
    -- e.g., 'fashion-week', 'ai-analysis'
    confidence_score DECIMAL(3, 2),
    -- Regional Specificity
    region TEXT,
    -- e.g., 'global', 'north-america', 'europe'
    valid_from DATE NOT NULL,
    valid_until DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(season, year, region)
);

-- ============================================================================
-- DUPLICATE DETECTION TABLE (Prevent Redundant Uploads)
-- ============================================================================
CREATE TABLE public.clothing_duplicates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    original_item_id UUID NOT NULL,
    duplicate_item_id UUID NOT NULL,
    similarity_score DECIMAL(3, 2) NOT NULL CHECK (
        similarity_score >= 0
        AND similarity_score <= 1
    ),
    detection_method TEXT DEFAULT 'embedding-similarity',
    -- or 'visual-hash'
    -- User Action
    user_confirmed BOOLEAN,
    -- NULL = pending, TRUE = confirmed dup, FALSE = not a dup
    resolved_at TIMESTAMPTZ,
    detected_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(original_item_id, duplicate_item_id)
);

-- MODIFICATION: New table for recommender logs (traceability for TFRS training)
CREATE TABLE public.recommendation_logs (
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recommendation_id UUID,
        input_context JSONB NOT NULL,
        -- e.g., {"mood": "relaxed", "weather_temp": 80}
        output_items UUID [],
        -- Generated clothing_item_ids
        ai_confidence DECIMAL(3, 2) CHECK (
            ai_confidence >= 0
            AND ai_confidence <= 1
        ),
        created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for new table
CREATE INDEX idx_logs_user_id ON public.recommendation_logs(user_id);

CREATE INDEX idx_logs_input_context ON public.recommendation_logs USING GIN (input_context);

-- RLS for new table
ALTER TABLE
    public.recommendation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY logs_select ON public.recommendation_logs FOR
SELECT
    USING (auth.uid() = user_id);

CREATE POLICY logs_insert ON public.recommendation_logs FOR
INSERT
    WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- ANALYTICS MATERIALIZED VIEW (Performance Optimization)
-- ============================================================================
CREATE MATERIALIZED VIEW public.user_wardrobe_analytics AS
SELECT
    u.user_id,
    COUNT(DISTINCT ci.id) as total_items,
    COUNT(DISTINCT ci.category) as category_diversity,
    AVG(ci.sustainability_score) as avg_sustainability,
    SUM(ci.times_worn) as total_wears,
    COUNT(DISTINCT or_rec.id) as total_recommendations,
    COUNT(
        DISTINCT CASE
            WHEN ui.interaction_type = 'liked' THEN ui.id
        END
    ) as liked_recommendations,
    COUNT(
        DISTINCT CASE
            WHEN ui.interaction_type = 'worn' THEN ui.id
        END
    ) as worn_recommendations,
    ROUND(
        COUNT(
            DISTINCT CASE
                WHEN ui.interaction_type = 'liked' THEN ui.id
            END
        ) :: DECIMAL / NULLIF(COUNT(DISTINCT or_rec.id), 0) * 100,
        2
    ) as recommendation_acceptance_rate,
    MAX(ci.created_at) as last_item_added,
    MAX(or_rec.generated_at) as last_recommendation_generated
FROM
    public.user_profiles u
    LEFT JOIN public.clothing_items ci ON u.user_id = ci.user_id
    AND ci.is_archived = FALSE
    AND ci.deleted_at IS NULL -- MODIFICATION: Filter soft deletes
    LEFT JOIN public.outfit_recommendations or_rec ON u.user_id = or_rec.user_id
    LEFT JOIN public.user_interactions ui ON or_rec.id = ui.recommendation_id
GROUP BY
    u.user_id;

-- Index for fast materialized view refresh
CREATE UNIQUE INDEX idx_user_analytics_user_id ON public.user_wardrobe_analytics(user_id);

-- ============================================================================
-- INDEXES (Performance Optimization)
-- ============================================================================
-- User Profiles
CREATE INDEX idx_user_profiles_location ON public.user_profiles(location_country, location_city);

CREATE INDEX idx_user_profiles_body_type ON public.user_profiles(body_type);

-- Clothing Items (Most Critical for Performance)
CREATE INDEX idx_clothing_user_id ON public.clothing_items(user_id);

CREATE INDEX idx_clothing_category ON public.clothing_items(category);

CREATE INDEX idx_clothing_subcategory ON public.clothing_items(subcategory);

CREATE INDEX idx_clothing_season ON public.clothing_items USING GIN(season);

CREATE INDEX idx_clothing_weather ON public.clothing_items USING GIN(weather_suitable);

CREATE INDEX idx_clothing_colors ON public.clothing_items(primary_color);

CREATE INDEX idx_clothing_style_tags ON public.clothing_items USING GIN(style_tags);

CREATE INDEX idx_clothing_archived ON public.clothing_items(user_id, is_archived);

CREATE INDEX idx_clothing_favorite ON public.clothing_items(user_id, is_favorite);

CREATE INDEX idx_clothing_last_worn ON public.clothing_items(last_worn_date DESC);

-- Vector similarity search (for AI recommendations)
CREATE INDEX idx_clothing_embedding ON public.clothing_items USING ivfflat(embedding vector_cosine_ops) WITH (lists = 100);

-- Outfit Recommendations
CREATE INDEX idx_recommendations_user_id ON public.outfit_recommendations(user_id);

CREATE INDEX idx_recommendations_occasion ON public.outfit_recommendations(occasion);

CREATE INDEX idx_recommendations_mood ON public.outfit_recommendations(mood);

CREATE INDEX idx_recommendations_weather ON public.outfit_recommendations(weather_condition);

CREATE INDEX idx_recommendations_generated_at ON public.outfit_recommendations(generated_at DESC);

CREATE INDEX idx_recommendations_score ON public.outfit_recommendations(ai_score DESC);

CREATE INDEX idx_recommendations_items ON public.outfit_recommendations USING GIN(clothing_item_ids);

-- User Interactions
CREATE INDEX idx_interactions_user_id ON public.user_interactions(user_id);

CREATE INDEX idx_interactions_recommendation_id ON public.user_interactions(recommendation_id);

CREATE INDEX idx_interactions_type ON public.user_interactions(interaction_type);

CREATE INDEX idx_interactions_date ON public.user_interactions(interacted_at DESC);

-- Wardrobe Gaps
CREATE INDEX idx_gaps_user_id ON public.wardrobe_gaps(user_id);

CREATE INDEX idx_gaps_priority ON public.wardrobe_gaps(priority DESC);

CREATE INDEX idx_gaps_addressed ON public.wardrobe_gaps(is_addressed);

-- Outfit Collections
CREATE INDEX idx_collections_user_id ON public.outfit_collections(user_id);

CREATE INDEX idx_collections_favorite ON public.outfit_collections(user_id, is_favorite);

CREATE INDEX idx_collections_public ON public.outfit_collections(is_public);

-- Seasonal Trends
CREATE INDEX idx_trends_season_year ON public.seasonal_trends(season, year);

CREATE INDEX idx_trends_validity ON public.seasonal_trends(valid_from, valid_until);

-- Duplicates
CREATE INDEX idx_duplicates_user_id ON public.clothing_duplicates(user_id);

CREATE INDEX idx_duplicates_unresolved ON public.clothing_duplicates(user_id)
WHERE
    user_confirmed IS NULL;

-- ============================================================================
-- TRIGGERS (Automatic Timestamp Updates)
-- ============================================================================
-- Generic update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column() 
RETURNS TRIGGER AS $$
BEGIN 
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to relevant tables
CREATE TRIGGER update_user_profiles_updated_at BEFORE
UPDATE
    ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clothing_items_updated_at BEFORE
UPDATE
    ON public.clothing_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wardrobe_gaps_updated_at BEFORE
UPDATE
    ON public.wardrobe_gaps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_outfit_collections_updated_at BEFORE
UPDATE
    ON public.outfit_collections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
-- Enable RLS on all user-specific tables
ALTER TABLE
    public.user_profiles ENABLE ROW LEVEL SECURITY;

ALTER TABLE
    public.clothing_items ENABLE ROW LEVEL SECURITY;

ALTER TABLE
    public.outfit_recommendations ENABLE ROW LEVEL SECURITY;

ALTER TABLE
    public.user_interactions ENABLE ROW LEVEL SECURITY;

ALTER TABLE
    public.wardrobe_gaps ENABLE ROW LEVEL SECURITY;

ALTER TABLE
    public.outfit_collections ENABLE ROW LEVEL SECURITY;

ALTER TABLE
    public.clothing_duplicates ENABLE ROW LEVEL SECURITY;

ALTER TABLE
    public.recommendation_logs ENABLE ROW LEVEL SECURITY;

-- MODIFICATION: Added for new table
-- User Profiles Policies
CREATE POLICY "Users can view own profile" ON public.user_profiles FOR
SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles FOR
INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.user_profiles FOR
UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own profile" ON public.user_profiles FOR DELETE USING (auth.uid() = user_id);

-- Clothing Items Policies
CREATE POLICY "Users can view own clothing items" ON public.clothing_items FOR
SELECT
    USING (
        auth.uid() = user_id
        AND deleted_at IS NULL
    );

-- MODIFICATION: Filter soft deletes in policy
CREATE POLICY "Users can insert own clothing items" ON public.clothing_items FOR
INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clothing items" ON public.clothing_items FOR
UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own clothing items" ON public.clothing_items FOR DELETE USING (auth.uid() = user_id);

-- Outfit Recommendations Policies
CREATE POLICY "Users can view own recommendations" ON public.outfit_recommendations FOR
SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recommendations" ON public.outfit_recommendations FOR
INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recommendations" ON public.outfit_recommendations FOR
UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recommendations" ON public.outfit_recommendations FOR DELETE USING (auth.uid() = user_id);

-- User Interactions Policies
CREATE POLICY "Users can view own interactions" ON public.user_interactions FOR
SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own interactions" ON public.user_interactions FOR
INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own interactions" ON public.user_interactions FOR
UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own interactions" ON public.user_interactions FOR DELETE USING (auth.uid() = user_id);

-- Wardrobe Gaps Policies
CREATE POLICY "Users can view own wardrobe gaps" ON public.wardrobe_gaps FOR
SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wardrobe gaps" ON public.wardrobe_gaps FOR
INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wardrobe gaps" ON public.wardrobe_gaps FOR
UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own wardrobe gaps" ON public.wardrobe_gaps FOR DELETE USING (auth.uid() = user_id);

-- Outfit Collections Policies
CREATE POLICY "Users can view own collections" ON public.outfit_collections FOR
SELECT
    USING (
        auth.uid() = user_id
        OR is_public = TRUE
    );

CREATE POLICY "Users can insert own collections" ON public.outfit_collections FOR
INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own collections" ON public.outfit_collections FOR
UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own collections" ON public.outfit_collections FOR DELETE USING (auth.uid() = user_id);

-- Clothing Duplicates Policies
CREATE POLICY "Users can view own duplicates" ON public.clothing_duplicates FOR
SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own duplicates" ON public.clothing_duplicates FOR
INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own duplicates" ON public.clothing_duplicates FOR
UPDATE
    USING (auth.uid() = user_id);

-- MODIFICATION: RLS for new table
CREATE POLICY "Users can view own logs" ON public.recommendation_logs FOR
SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own logs" ON public.recommendation_logs FOR
INSERT
    WITH CHECK (auth.uid() = user_id);

-- Seasonal Trends (Public Read Access)
ALTER TABLE
    public.seasonal_trends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view seasonal trends" ON public.seasonal_trends FOR
SELECT
    USING (true);

-- Analytics View (Users can only see their own analytics)
-- Note: RLS not supported on materialized views, handle in application layer

-- ============================================================================
-- SUPABASE STORAGE SETUP (Bucket Policies)
-- ============================================================================
-- Note: Execute these via Supabase Dashboard or Storage API
-- This is SQL representation for documentation
/*
 -- Create storage bucket for clothing images
 INSERT INTO storage.buckets (id, name, public)
 VALUES ('clothing', 'clothing', false);
 
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
 */
-- ============================================================================
-- REALTIME PUBLICATION (Enable Live Updates)
-- ============================================================================
-- Enable realtime for critical tables
ALTER PUBLICATION supabase_realtime
ADD
    TABLE public.clothing_items;

ALTER PUBLICATION supabase_realtime
ADD
    TABLE public.outfit_recommendations;

ALTER PUBLICATION supabase_realtime
ADD
    TABLE public.user_interactions;

-- MODIFICATION: Added for new table
ALTER PUBLICATION supabase_realtime
ADD
    TABLE public.recommendation_logs;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================
-- Function to refresh analytics materialized view
CREATE OR REPLACE FUNCTION refresh_wardrobe_analytics() 
RETURNS void AS $$
BEGIN 
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.user_wardrobe_analytics;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to find similar clothing items (vector similarity)
CREATE OR REPLACE FUNCTION find_similar_items(
    target_embedding VECTOR(512),
    target_user_id UUID,
    similarity_threshold DECIMAL DEFAULT 0.7,
    limit_count INTEGER DEFAULT 10
) RETURNS TABLE(
    item_id UUID,
    name TEXT,
    category clothing_category,
    similarity_score DECIMAL
) AS $$
BEGIN 
    RETURN QUERY
SELECT
    ci.id,
    ci.name,
    ci.category,
    (1 - (ci.embedding <=> target_embedding)) :: DECIMAL(3, 2) as similarity
FROM
    public.clothing_items ci
WHERE
    ci.user_id = target_user_id
    AND ci.is_archived = FALSE
    AND ci.deleted_at IS NULL -- MODIFICATION: Filter soft deletes
    AND (1 - (ci.embedding <=> target_embedding)) >= similarity_threshold
ORDER BY
    ci.embedding <=> target_embedding
LIMIT
    limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate wardrobe diversity score
CREATE OR REPLACE FUNCTION calculate_wardrobe_diversity(target_user_id UUID) 
RETURNS DECIMAL AS $$
DECLARE 
    diversity_score DECIMAL;
BEGIN
SELECT
    (
        COUNT(DISTINCT category) * 10 + COUNT(DISTINCT primary_color) * 5 + COUNT(DISTINCT subcategory) * 3 + CASE
            WHEN COUNT(DISTINCT season) > 1 THEN 20
            ELSE 0
        END
    ) :: DECIMAL / 100.0 INTO diversity_score
FROM
    public.clothing_items
WHERE
    user_id = target_user_id
    AND is_archived = FALSE
    AND deleted_at IS NULL;

-- MODIFICATION: Filter soft deletes
    RETURN LEAST(diversity_score, 1.0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- INITIAL DATA (Optional: Sample Seasonal Trends)
-- ============================================================================
INSERT INTO
    public.seasonal_trends (
        season,
        year,
        trending_colors,
        trending_patterns,
        trending_styles,
        trending_categories,
        trend_description,
        region,
        valid_from,
        valid_until
    )
VALUES
    (
        'spring',
        2025,
        ARRAY ['pastel-pink', 'mint-green', 'lavender'],
        ARRAY ['floral', 'gingham'],
        ARRAY ['romantic', 'cottagecore'],
        ARRAY ['dresses', 'tops']::clothing_category[],
        'Spring 2025 emphasizes soft pastels and feminine silhouettes',
        'global',
        '2025-03-01',
        '2025-05-31'
    ),
    (
        'summer',
        2025,
        ARRAY ['coral', 'turquoise', 'yellow'],
        ARRAY ['tropical', 'tie-dye'],
        ARRAY ['bohemian', 'resort'],
        ARRAY ['swimwear', 'dresses']::clothing_category[],
        'Summer trends focus on vibrant colors and relaxed fits',
        'global',
        '2025-06-01',
        '2025-08-31'
    ),
    (
        'fall',
        2025,
        ARRAY ['rust', 'olive-green', 'burgundy'],
        ARRAY ['plaid', 'houndstooth'],
        ARRAY ['preppy', 'academia'],
        ARRAY ['outerwear', 'shoes']::clothing_category[],
        'Fall 2025 brings back classic patterns with earthy tones',
        'global',
        '2025-09-01',
        '2025-11-30'
    ),
    (
        'winter',
        2025,
        ARRAY ['charcoal', 'emerald', 'wine-red'],
        ARRAY ['herringbone', 'cable-knit'],
        ARRAY ['minimalist', 'sophisticated'],
        ARRAY ['outerwear', 'tops']::clothing_category[],
        'Winter trends lean into luxe textures and deep jewel tones',
        'global',
        '2025-12-01',
        '2026-02-28'
    );

-- ============================================================================
-- COMMENTS (Documentation)
-- ============================================================================
COMMENT ON TABLE public.user_profiles IS 'Stores user profile information including body type, preferences, and location for personalized recommendations';

COMMENT ON TABLE public.clothing_items IS 'Main wardrobe inventory with AI-extracted attributes and embeddings for similarity matching';

COMMENT ON TABLE public.outfit_recommendations IS 'AI-generated outfit suggestions with contextual scoring and gap analysis';

COMMENT ON TABLE public.user_interactions IS 'Tracks user feedback on recommendations and clothing items for ML training';

COMMENT ON TABLE public.wardrobe_gaps IS 'Identifies missing items in user wardrobes with purchase suggestions';

COMMENT ON TABLE public.outfit_collections IS 'User-curated outfit combinations that can be saved and shared';

COMMENT ON TABLE public.seasonal_trends IS 'Global and regional fashion trends to influence recommendations';

COMMENT ON TABLE public.clothing_duplicates IS 'Detects and manages duplicate clothing uploads using AI similarity';

COMMENT ON MATERIALIZED VIEW public.user_wardrobe_analytics IS 'Aggregated analytics for user wardrobe metrics and recommendation performance';

-- MODIFICATION: Added comment for new table
COMMENT ON TABLE public.recommendation_logs IS 'Logs AI recommendation runs for training and debugging';

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================

-- Migration: 20251021093944_dynamic_categories.sql



-- Migration: 20251021094117_dynamic_categories.sql

-- ============================================================================
-- DYNAMIC CATEGORIES MIGRATION
-- Replace enum-based categories with scalable reference tables
-- ============================================================================

-- Core category reference table
CREATE TABLE public.clothing_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    parent_category_id UUID REFERENCES public.clothing_categories(id),
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    source TEXT DEFAULT 'manual', -- 'manual', 'ai_suggested', 'trend_analysis'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subcategory reference table
CREATE TABLE public.clothing_subcategories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category_id UUID NOT NULL REFERENCES public.clothing_categories(id),
    is_active BOOLEAN DEFAULT TRUE,
    source TEXT DEFAULT 'manual',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(name, category_id)
);

-- Style tags reference table (completely dynamic)
CREATE TABLE public.style_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    popularity_score INTEGER DEFAULT 0,
    is_trending BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    source TEXT DEFAULT 'manual',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert core categories (stable foundation)
INSERT INTO public.clothing_categories (name, display_order) VALUES
('tops', 1),
('bottoms', 2),
('dresses', 3),
('outerwear', 4),
('shoes', 5),
('accessories', 6),
('activewear', 7),
('formalwear', 8);

-- Insert common subcategories
INSERT INTO public.clothing_subcategories (name, category_id) 
SELECT 't-shirt', id FROM public.clothing_categories WHERE name = 'tops'
UNION ALL
SELECT 'blouse', id FROM public.clothing_categories WHERE name = 'tops'
UNION ALL
SELECT 'jeans', id FROM public.clothing_categories WHERE name = 'bottoms'
UNION ALL
SELECT 'sneakers', id FROM public.clothing_categories WHERE name = 'shoes';

-- Insert common style tags
INSERT INTO public.style_tags (name, popularity_score) VALUES
('casual', 100),
('formal', 90),
('vintage', 70),
('minimalist', 80),
('bohemian', 60);

-- Add indexes
CREATE INDEX idx_categories_active ON public.clothing_categories(is_active);
CREATE INDEX idx_categories_parent ON public.clothing_categories(parent_category_id);
CREATE INDEX idx_subcategories_category ON public.clothing_subcategories(category_id);
CREATE INDEX idx_subcategories_active ON public.clothing_subcategories(is_active);
CREATE INDEX idx_style_tags_trending ON public.style_tags(is_trending);
CREATE INDEX idx_style_tags_popularity ON public.style_tags(popularity_score DESC);

-- RLS policies
ALTER TABLE public.clothing_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clothing_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.style_tags ENABLE ROW LEVEL SECURITY;

-- Public read access for categories (everyone needs to see them)
CREATE POLICY "Anyone can view active categories" ON public.clothing_categories 
FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Anyone can view active subcategories" ON public.clothing_subcategories 
FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Anyone can view active style tags" ON public.style_tags 
FOR SELECT USING (is_active = TRUE);

-- Only authenticated users can suggest new categories
CREATE POLICY "Authenticated users can suggest categories" ON public.clothing_categories 
FOR INSERT TO authenticated WITH CHECK (source = 'ai_suggested');

CREATE POLICY "Authenticated users can suggest subcategories" ON public.clothing_subcategories 
FOR INSERT TO authenticated WITH CHECK (source = 'ai_suggested');

CREATE POLICY "Authenticated users can suggest style tags" ON public.style_tags 
FOR INSERT TO authenticated WITH CHECK (source = 'ai_suggested');

-- Helper function to find or create category
CREATE OR REPLACE FUNCTION find_or_create_category(category_name TEXT)
RETURNS UUID AS $$
DECLARE
    category_id UUID;
BEGIN
    -- Try to find existing category
    SELECT id INTO category_id 
    FROM public.clothing_categories 
    WHERE name = category_name AND is_active = TRUE;
    
    -- If not found, create as AI suggested (pending approval)
    IF category_id IS NULL THEN
        INSERT INTO public.clothing_categories (name, is_active, source)
        VALUES (category_name, FALSE, 'ai_suggested')
        RETURNING id INTO category_id;
    END IF;
    
    RETURN category_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to find or create subcategory
CREATE OR REPLACE FUNCTION find_or_create_subcategory(subcategory_name TEXT, parent_category_id UUID)
RETURNS UUID AS $$
DECLARE
    subcategory_id UUID;
BEGIN
    -- Try to find existing subcategory
    SELECT id INTO subcategory_id 
    FROM public.clothing_subcategories 
    WHERE name = subcategory_name 
    AND category_id = parent_category_id 
    AND is_active = TRUE;
    
    -- If not found, create as AI suggested
    IF subcategory_id IS NULL THEN
        INSERT INTO public.clothing_subcategories (name, category_id, is_active, source)
        VALUES (subcategory_name, parent_category_id, FALSE, 'ai_suggested')
        RETURNING id INTO subcategory_id;
    END IF;
    
    RETURN subcategory_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update triggers
CREATE TRIGGER update_categories_updated_at 
BEFORE UPDATE ON public.clothing_categories 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE public.clothing_categories IS 'Dynamic clothing categories that can grow with fashion trends';
COMMENT ON TABLE public.clothing_subcategories IS 'Subcategories linked to main categories';
COMMENT ON TABLE public.style_tags IS 'Dynamic style tags for trend tracking';

-- Migration: 20251021094305_update_clothing_items_references.sql

-- ============================================================================
-- UPDATE CLOTHING ITEMS TO USE REFERENCE TABLES
-- Replace enum columns with foreign key references
-- ============================================================================

-- Add new columns that reference the dynamic tables
ALTER TABLE public.clothing_items 
ADD COLUMN category_id UUID REFERENCES public.clothing_categories(id),
ADD COLUMN subcategory_id UUID REFERENCES public.clothing_subcategories(id);

-- Create junction table for style tags (many-to-many relationship)
CREATE TABLE public.clothing_item_style_tags (
    clothing_item_id UUID,
    style_tag_id UUID REFERENCES public.style_tags(id),
    PRIMARY KEY (clothing_item_id, style_tag_id)
);

-- Add indexes for the new foreign keys
CREATE INDEX idx_clothing_items_category ON public.clothing_items(category_id);
CREATE INDEX idx_clothing_items_subcategory ON public.clothing_items(subcategory_id);
CREATE INDEX idx_style_tags_junction_item ON public.clothing_item_style_tags(clothing_item_id);
CREATE INDEX idx_style_tags_junction_tag ON public.clothing_item_style_tags(style_tag_id);

-- RLS for junction table
ALTER TABLE public.clothing_item_style_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own item style tags" ON public.clothing_item_style_tags
FOR ALL USING (
    clothing_item_id IN (
        SELECT id FROM public.clothing_items WHERE user_id = auth.uid()
    )
);

-- Helper function to get clothing item with all related data
CREATE OR REPLACE FUNCTION get_clothing_item_with_categories(item_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'id', ci.id,
        'name', ci.name,
        'category', CASE 
            WHEN cc.id IS NOT NULL THEN json_build_object('id', cc.id, 'name', cc.name)
            ELSE NULL 
        END,
        'subcategory', CASE 
            WHEN cs.id IS NOT NULL THEN json_build_object('id', cs.id, 'name', cs.name)
            ELSE NULL 
        END,
        'style_tags', COALESCE((
            SELECT json_agg(json_build_object('id', st.id, 'name', st.name))
            FROM public.clothing_item_style_tags cist
            JOIN public.style_tags st ON cist.style_tag_id = st.id
            WHERE cist.clothing_item_id = ci.id
        ), '[]'::json),
        'primary_color', ci.primary_color,
        'secondary_colors', ci.secondary_colors,
        'material', ci.material,
        'pattern', ci.pattern,
        'image_url', ci.image_url,
        'thumbnail_url', ci.thumbnail_url,
        'times_worn', ci.times_worn,
        'is_favorite', ci.is_favorite,
        'created_at', ci.created_at
    ) INTO result
    FROM public.clothing_items ci
    LEFT JOIN public.clothing_categories cc ON ci.category_id = cc.id
    LEFT JOIN public.clothing_subcategories cs ON ci.subcategory_id = cs.id
    WHERE ci.id = item_id;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to add style tags to clothing item
CREATE OR REPLACE FUNCTION add_style_tags_to_item(item_id UUID, tag_names TEXT[])
RETURNS VOID AS $$
DECLARE
    tag_name TEXT;
    tag_id UUID;
BEGIN
    FOREACH tag_name IN ARRAY tag_names
    LOOP
        -- Find or create style tag
        SELECT id INTO tag_id FROM public.style_tags WHERE name = tag_name;
        
        IF tag_id IS NULL THEN
            INSERT INTO public.style_tags (name, source) 
            VALUES (tag_name, 'ai_suggested') 
            RETURNING id INTO tag_id;
        END IF;
        
        -- Link to clothing item (ignore if already exists)
        INSERT INTO public.clothing_item_style_tags (clothing_item_id, style_tag_id)
        VALUES (item_id, tag_id)
        ON CONFLICT DO NOTHING;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get active categories for Gemini prompts
CREATE OR REPLACE FUNCTION get_active_categories_for_prompt()
RETURNS JSON AS $$
BEGIN
    RETURN json_build_object(
        'categories', (
            SELECT json_agg(name ORDER BY display_order)
            FROM public.clothing_categories 
            WHERE is_active = TRUE
        ),
        'subcategories', (
            SELECT json_object_agg(
                cc.name,
                json_agg(cs.name ORDER BY cs.name)
            )
            FROM public.clothing_categories cc
            JOIN public.clothing_subcategories cs ON cc.id = cs.category_id
            WHERE cc.is_active = TRUE AND cs.is_active = TRUE
            GROUP BY cc.name
        ),
        'style_tags', (
            SELECT json_agg(name ORDER BY popularity_score DESC)
            FROM public.style_tags 
            WHERE is_active = TRUE
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON FUNCTION get_clothing_item_with_categories IS 'Returns clothing item with all category and style tag data as JSON';
COMMENT ON FUNCTION add_style_tags_to_item IS 'Adds multiple style tags to a clothing item, creating new tags if needed';
COMMENT ON FUNCTION get_active_categories_for_prompt IS 'Returns all active categories/subcategories/tags for AI prompts';

-- Migration: 20251021103105_migrate_enum_data_to_references.sql

-- ============================================================================
-- MIGRATE ENUM DATA TO REFERENCE TABLES
-- Move existing enum data to the new foreign key columns
-- ============================================================================

-- First, ensure all enum values exist in reference tables
-- Add any missing categories from the enum
INSERT INTO public.clothing_categories (name, display_order, source)
SELECT DISTINCT 
    unnest(enum_range(NULL::clothing_category))::text,
    ROW_NUMBER() OVER (ORDER BY unnest(enum_range(NULL::clothing_category))::text),
    'migration'
ON CONFLICT (name) DO NOTHING;

-- Add any missing subcategories from the enum
INSERT INTO public.clothing_subcategories (name, category_id, source)
SELECT DISTINCT 
    subcategory_name,
    cc.id,
    'migration'
FROM (
    SELECT unnest(enum_range(NULL::clothing_subcategory))::text as subcategory_name
) sub
CROSS JOIN public.clothing_categories cc
WHERE cc.name = CASE 
    -- Map subcategories to their parent categories
    WHEN subcategory_name IN ('t-shirt', 'blouse', 'shirt', 'tank-top', 'sweater', 'hoodie', 'cardigan', 'polo') THEN 'tops'
    WHEN subcategory_name IN ('jeans', 'trousers', 'shorts', 'skirt', 'leggings', 'joggers', 'chinos') THEN 'bottoms'
    WHEN subcategory_name IN ('maxi-dress', 'mini-dress', 'midi-dress', 'cocktail-dress', 'sundress') THEN 'dresses'
    WHEN subcategory_name IN ('jacket', 'coat', 'blazer', 'parka', 'vest', 'raincoat', 'windbreaker') THEN 'outerwear'
    WHEN subcategory_name IN ('sneakers', 'boots', 'sandals', 'heels', 'flats', 'loafers', 'oxfords', 'slippers') THEN 'shoes'
    WHEN subcategory_name IN ('necklace', 'bracelet', 'earrings', 'ring') THEN 'jewelry'
    WHEN subcategory_name IN ('handbag', 'backpack', 'clutch') THEN 'bags'
    WHEN subcategory_name IN ('baseball-cap', 'beanie', 'fedora') THEN 'hats'
    WHEN subcategory_name IN ('sunglasses') THEN 'eyewear'
    WHEN subcategory_name IN ('watch') THEN 'watches'
    WHEN subcategory_name IN ('belt') THEN 'belts'
    WHEN subcategory_name IN ('scarf') THEN 'scarves'
    WHEN subcategory_name IN ('tie', 'bow-tie') THEN 'accessories'
    WHEN subcategory_name IN ('gloves', 'socks', 'tights') THEN 'accessories'
    ELSE 'accessories' -- fallback
END
ON CONFLICT (name, category_id) DO NOTHING;

-- Update clothing_items to use foreign key references
UPDATE public.clothing_items 
SET category_id = cc.id
FROM public.clothing_categories cc
WHERE cc.name = clothing_items.category::text;

UPDATE public.clothing_items 
SET subcategory_id = cs.id
FROM public.clothing_subcategories cs
JOIN public.clothing_categories cc ON cs.category_id = cc.id
WHERE cs.name = clothing_items.subcategory::text
AND cc.name = clothing_items.category::text;

-- Migrate style_tags array to junction table
INSERT INTO public.clothing_item_style_tags (clothing_item_id, style_tag_id)
SELECT DISTINCT 
    ci.id,
    st.id
FROM public.clothing_items ci
CROSS JOIN LATERAL unnest(ci.style_tags) AS tag_name
JOIN public.style_tags st ON st.name = tag_name
ON CONFLICT DO NOTHING;

-- Add any missing style tags from existing data
INSERT INTO public.style_tags (name, source)
SELECT DISTINCT tag_name, 'migration'
FROM public.clothing_items ci
CROSS JOIN LATERAL unnest(ci.style_tags) AS tag_name
WHERE NOT EXISTS (
    SELECT 1 FROM public.style_tags st WHERE st.name = tag_name
)
ON CONFLICT (name) DO NOTHING;

-- Re-run the junction table insert for newly created tags
INSERT INTO public.clothing_item_style_tags (clothing_item_id, style_tag_id)
SELECT DISTINCT 
    ci.id,
    st.id
FROM public.clothing_items ci
CROSS JOIN LATERAL unnest(ci.style_tags) AS tag_name
JOIN public.style_tags st ON st.name = tag_name
ON CONFLICT DO NOTHING;

-- Update wardrobe_gaps table to use foreign key references
UPDATE public.wardrobe_gaps 
SET category = NULL; -- Will be handled in application layer with new structure

-- Comments
COMMENT ON COLUMN public.clothing_items.category_id IS 'Foreign key reference to clothing_categories table';
COMMENT ON COLUMN public.clothing_items.subcategory_id IS 'Foreign key reference to clothing_subcategories table';

-- Migration: 20251021103229_drop_old_enum_columns.sql

-- ============================================================================
-- DROP OLD ENUM COLUMNS AND TYPES
-- Clean up the old enum-based columns after data migration
-- ============================================================================

-- Drop materialized view first (it depends on old columns)
DROP MATERIALIZED VIEW IF EXISTS public.user_wardrobe_analytics;

-- Update indexes that referenced old enum columns
DROP INDEX IF EXISTS idx_clothing_category;
DROP INDEX IF EXISTS idx_clothing_subcategory;
DROP INDEX IF EXISTS idx_clothing_style_tags;

-- Drop old enum columns from clothing_items
ALTER TABLE public.clothing_items 
DROP COLUMN IF EXISTS category,
DROP COLUMN IF EXISTS subcategory,
DROP COLUMN IF EXISTS style_tags;

-- Drop old enum columns from wardrobe_gaps
ALTER TABLE public.wardrobe_gaps 
DROP COLUMN IF EXISTS category,
DROP COLUMN IF EXISTS subcategory;

-- Create new indexes for foreign key columns
CREATE INDEX idx_clothing_category_id ON public.clothing_items(category_id);
CREATE INDEX idx_clothing_subcategory_id ON public.clothing_items(subcategory_id);

-- Recreate materialized view with new foreign key columns

CREATE MATERIALIZED VIEW public.user_wardrobe_analytics AS
SELECT
    u.user_id,
    COUNT(DISTINCT ci.id) as total_items,
    COUNT(DISTINCT ci.category_id) as category_diversity,
    AVG(ci.sustainability_score) as avg_sustainability,
    SUM(ci.times_worn) as total_wears,
    COUNT(DISTINCT or_rec.id) as total_recommendations,
    COUNT(
        DISTINCT CASE
            WHEN ui.interaction_type = 'liked' THEN ui.id
        END
    ) as liked_recommendations,
    COUNT(
        DISTINCT CASE
            WHEN ui.interaction_type = 'worn' THEN ui.id
        END
    ) as worn_recommendations,
    ROUND(
        COUNT(
            DISTINCT CASE
                WHEN ui.interaction_type = 'liked' THEN ui.id
            END
        ) :: DECIMAL / NULLIF(COUNT(DISTINCT or_rec.id), 0) * 100,
        2
    ) as recommendation_acceptance_rate,
    MAX(ci.created_at) as last_item_added,
    MAX(or_rec.generated_at) as last_recommendation_generated
FROM
    public.user_profiles u
    LEFT JOIN public.clothing_items ci ON u.user_id = ci.user_id
    AND ci.is_archived = FALSE
    AND ci.deleted_at IS NULL
    LEFT JOIN public.outfit_recommendations or_rec ON u.user_id = or_rec.user_id
    LEFT JOIN public.user_interactions ui ON or_rec.id = ui.recommendation_id
GROUP BY
    u.user_id;

-- Recreate unique index for materialized view
CREATE UNIQUE INDEX idx_user_analytics_user_id ON public.user_wardrobe_analytics(user_id);

-- Update helper functions to use new foreign key columns
DROP FUNCTION IF EXISTS find_similar_items(VECTOR(512), UUID, DECIMAL, INTEGER);

CREATE OR REPLACE FUNCTION find_similar_items(
    target_embedding VECTOR(512),
    target_user_id UUID,
    similarity_threshold DECIMAL DEFAULT 0.7,
    limit_count INTEGER DEFAULT 10
) RETURNS TABLE(
    item_id UUID,
    name TEXT,
    category_name TEXT,
    similarity_score DECIMAL
) AS $$
BEGIN 
    RETURN QUERY
SELECT
    ci.id,
    ci.name,
    cc.name,
    (1 - (ci.embedding <=> target_embedding)) :: DECIMAL(3, 2) as similarity
FROM
    public.clothing_items ci
    LEFT JOIN public.clothing_categories cc ON ci.category_id = cc.id
WHERE
    ci.user_id = target_user_id
    AND ci.is_archived = FALSE
    AND ci.deleted_at IS NULL
    AND (1 - (ci.embedding <=> target_embedding)) >= similarity_threshold
ORDER BY
    ci.embedding <=> target_embedding
LIMIT
    limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update diversity calculation function
DROP FUNCTION IF EXISTS calculate_wardrobe_diversity(UUID);

CREATE OR REPLACE FUNCTION calculate_wardrobe_diversity(target_user_id UUID) 
RETURNS DECIMAL AS $$
DECLARE 
    diversity_score DECIMAL;
BEGIN
SELECT
    (
        COUNT(DISTINCT ci.category_id) * 10 + 
        COUNT(DISTINCT ci.primary_color) * 5 + 
        COUNT(DISTINCT ci.subcategory_id) * 3 + 
        CASE
            WHEN COUNT(DISTINCT season_elem) > 1 THEN 20
            ELSE 0
        END
    ) :: DECIMAL / 100.0 INTO diversity_score
FROM
    public.clothing_items ci
    CROSS JOIN LATERAL unnest(ci.season) AS season_elem
WHERE
    ci.user_id = target_user_id
    AND ci.is_archived = FALSE
    AND ci.deleted_at IS NULL;

    RETURN LEAST(diversity_score, 1.0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop old enum types (only if no other tables use them)
-- Note: Keep these for now as seasonal_trends still uses them
-- DROP TYPE IF EXISTS clothing_category CASCADE;
-- DROP TYPE IF EXISTS clothing_subcategory CASCADE;

-- Migration completed: enum-based categories replaced with foreign key references

-- Migration: 20251021104602_complete_enum_migration.sql

-- ============================================================================
-- COMPLETE ENUM MIGRATION
-- Migrate remaining tables from enums to foreign key references
-- ============================================================================

-- Update wardrobe_gaps table
ALTER TABLE public.wardrobe_gaps 
ADD COLUMN category_id UUID REFERENCES public.clothing_categories(id);

-- Update seasonal_trends table
ALTER TABLE public.seasonal_trends 
ADD COLUMN trending_category_ids UUID[];

-- Create junction table for seasonal trends categories (many-to-many)
CREATE TABLE public.seasonal_trend_categories (
    trend_id UUID REFERENCES public.seasonal_trends(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.clothing_categories(id) ON DELETE CASCADE,
    PRIMARY KEY (trend_id, category_id)
);

-- Migrate existing data in seasonal_trends
INSERT INTO public.seasonal_trend_categories (trend_id, category_id)
SELECT DISTINCT 
    st.id,
    cc.id
FROM public.seasonal_trends st
CROSS JOIN LATERAL unnest(st.trending_categories) AS trend_cat
JOIN public.clothing_categories cc ON cc.name = trend_cat::text
WHERE st.trending_categories IS NOT NULL;

-- Update seasonal_trends with new array format
UPDATE public.seasonal_trends 
SET trending_category_ids = (
    SELECT array_agg(stc.category_id)
    FROM public.seasonal_trend_categories stc
    WHERE stc.trend_id = seasonal_trends.id
);

-- Drop old enum column from seasonal_trends
ALTER TABLE public.seasonal_trends 
DROP COLUMN IF EXISTS trending_categories;

-- Add indexes for new foreign keys
CREATE INDEX idx_wardrobe_gaps_category_id ON public.wardrobe_gaps(category_id);
CREATE INDEX idx_seasonal_trends_category_ids ON public.seasonal_trends USING GIN(trending_category_ids);
CREATE INDEX idx_seasonal_trend_categories_trend ON public.seasonal_trend_categories(trend_id);
CREATE INDEX idx_seasonal_trend_categories_category ON public.seasonal_trend_categories(category_id);

-- RLS for junction table
ALTER TABLE public.seasonal_trend_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view trend categories" ON public.seasonal_trend_categories 
FOR SELECT USING (true);

-- Update helper functions to work with new structure
CREATE OR REPLACE FUNCTION get_trending_categories_for_season(target_season season, target_year INTEGER)
RETURNS JSON AS $$
BEGIN
    RETURN (
        SELECT json_agg(
            json_build_object(
                'id', cc.id,
                'name', cc.name,
                'trend_description', st.trend_description
            )
        )
        FROM public.seasonal_trends st
        JOIN public.seasonal_trend_categories stc ON st.id = stc.trend_id
        JOIN public.clothing_categories cc ON stc.category_id = cc.id
        WHERE st.season = target_season 
        AND st.year = target_year
        AND CURRENT_DATE BETWEEN st.valid_from AND st.valid_until
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add trending categories to seasonal trend
CREATE OR REPLACE FUNCTION add_trending_categories_to_trend(
    trend_id UUID, 
    category_names TEXT[]
)
RETURNS VOID AS $$
DECLARE
    category_name TEXT;
    category_id UUID;
BEGIN
    FOREACH category_name IN ARRAY category_names
    LOOP
        -- Find or create category
        SELECT id INTO category_id 
        FROM public.clothing_categories 
        WHERE name = category_name;
        
        IF category_id IS NULL THEN
            INSERT INTO public.clothing_categories (name, source) 
            VALUES (category_name, 'trend_analysis') 
            RETURNING id INTO category_id;
        END IF;
        
        -- Link to trend (ignore if already exists)
        INSERT INTO public.seasonal_trend_categories (trend_id, category_id)
        VALUES (trend_id, category_id)
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    -- Update the array column for backward compatibility
    UPDATE public.seasonal_trends 
    SET trending_category_ids = (
        SELECT array_agg(stc.category_id)
        FROM public.seasonal_trend_categories stc
        WHERE stc.trend_id = add_trending_categories_to_trend.trend_id
    )
    WHERE id = add_trending_categories_to_trend.trend_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Now we can safely drop the enum types
DROP TYPE IF EXISTS clothing_category CASCADE;
DROP TYPE IF EXISTS clothing_subcategory CASCADE;

-- Comments
COMMENT ON TABLE public.seasonal_trend_categories IS 'Junction table linking seasonal trends to clothing categories';
COMMENT ON FUNCTION get_trending_categories_for_season IS 'Returns trending categories for a specific season and year';
COMMENT ON FUNCTION add_trending_categories_to_trend IS 'Adds multiple categories to a seasonal trend';

-- Migration: 20251021114044_fix_security_and_integrity_issues.sql

-- ============================================================================
-- FIX SECURITY AND DATA INTEGRITY ISSUES
-- Address critical issues found in code review
-- ============================================================================

-- 1. ADD INPUT VALIDATION TO HELPER FUNCTIONS
-- Replace existing functions with validated versions

DROP FUNCTION IF EXISTS find_or_create_category(TEXT);
CREATE OR REPLACE FUNCTION find_or_create_category(category_name TEXT)
RETURNS UUID AS $$
DECLARE
    category_id UUID;
    clean_name TEXT;
BEGIN
    -- Input validation
    IF category_name IS NULL OR trim(category_name) = '' THEN
        RAISE EXCEPTION 'Category name cannot be null or empty';
    END IF;
    
    IF length(trim(category_name)) > 100 THEN
        RAISE EXCEPTION 'Category name too long (max 100 characters)';
    END IF;
    
    -- Sanitize input
    clean_name := lower(trim(regexp_replace(category_name, '[^a-zA-Z0-9\s\-]', '', 'g')));
    
    -- Try to find existing category
    SELECT id INTO category_id 
    FROM public.clothing_categories 
    WHERE lower(name) = clean_name AND is_active = TRUE;
    
    -- If not found, create as AI suggested (pending approval)
    IF category_id IS NULL THEN
        INSERT INTO public.clothing_categories (name, is_active, source)
        VALUES (clean_name, FALSE, 'ai_suggested')
        RETURNING id INTO category_id;
    END IF;
    
    RETURN category_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. ADD RATE LIMITING FOR CATEGORY CREATION
CREATE TABLE IF NOT EXISTS public.category_creation_log (
    user_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    category_name TEXT NOT NULL
);

CREATE INDEX idx_category_creation_log_user_time ON public.category_creation_log(user_id, created_at);

-- Rate limiting function
CREATE OR REPLACE FUNCTION check_category_creation_rate_limit(target_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    recent_count INTEGER;
BEGIN
    -- Check if user has created more than 10 categories in the last hour
    SELECT COUNT(*) INTO recent_count
    FROM public.category_creation_log
    WHERE user_id = target_user_id
    AND created_at > NOW() - INTERVAL '1 hour';
    
    RETURN recent_count < 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. ADD MISSING FOREIGN KEY CONSTRAINTS (where possible with partitioning)
-- Add check constraints to ensure referential integrity

ALTER TABLE public.clothing_item_style_tags 
ADD CONSTRAINT fk_clothing_item_exists 
CHECK (clothing_item_id IS NOT NULL);

-- 4. ADD CLEANUP FUNCTION FOR ORPHANED RECORDS
CREATE OR REPLACE FUNCTION cleanup_orphaned_records()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
    temp_count INTEGER;
BEGIN
    -- Clean up orphaned style tag associations
    DELETE FROM public.clothing_item_style_tags cist
    WHERE NOT EXISTS (
        SELECT 1 FROM public.clothing_items ci 
        WHERE ci.id = cist.clothing_item_id
    );
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Clean up orphaned seasonal trend categories
    DELETE FROM public.seasonal_trend_categories stc
    WHERE NOT EXISTS (
        SELECT 1 FROM public.seasonal_trends st 
        WHERE st.id = stc.trend_id
    );
    
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_count := deleted_count + temp_count;
    
    -- Log cleanup activity
    INSERT INTO public.category_creation_log (user_id, category_name)
    VALUES ('00000000-0000-0000-0000-000000000000', 'CLEANUP: ' || deleted_count || ' orphaned records removed');
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. ADD PERFORMANCE INDEXES FOR COMMON QUERIES
CREATE INDEX IF NOT EXISTS idx_clothing_items_user_category ON public.clothing_items(user_id, category_id);
CREATE INDEX IF NOT EXISTS idx_clothing_items_user_active ON public.clothing_items(user_id, is_archived, deleted_at);
CREATE INDEX IF NOT EXISTS idx_style_tags_popularity ON public.style_tags(popularity_score DESC, is_active);
CREATE INDEX IF NOT EXISTS idx_categories_active_source ON public.clothing_categories(is_active, source);

-- 6. ADD VALIDATION FUNCTION FOR AI RESPONSES
CREATE OR REPLACE FUNCTION validate_ai_clothing_analysis(analysis_json JSONB)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check required fields exist
    IF NOT (analysis_json ? 'name' AND 
            analysis_json ? 'primary_color' AND 
            analysis_json ? 'ai_confidence_score') THEN
        RETURN FALSE;
    END IF;
    
    -- Validate confidence score range
    IF (analysis_json->>'ai_confidence_score')::DECIMAL NOT BETWEEN 0 AND 1 THEN
        RETURN FALSE;
    END IF;
    
    -- Validate name length
    IF length(analysis_json->>'name') > 200 THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 7. ADD ERROR LOGGING TABLE
CREATE TABLE IF NOT EXISTS public.error_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    error_type TEXT NOT NULL,
    error_message TEXT NOT NULL,
    context JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_error_logs_type_time ON public.error_logs(error_type, created_at);
CREATE INDEX idx_error_logs_user ON public.error_logs(user_id);

-- RLS for error logs
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own errors" ON public.error_logs 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert errors" ON public.error_logs 
FOR INSERT WITH CHECK (true);

-- 8. ADD FUNCTION TO LOG ERRORS
CREATE OR REPLACE FUNCTION log_error(
    target_user_id UUID,
    error_type TEXT,
    error_message TEXT,
    error_context JSONB DEFAULT '{}'
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.error_logs (user_id, error_type, error_message, context)
    VALUES (target_user_id, error_type, error_message, error_context);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. ADD MATERIALIZED VIEW REFRESH SCHEDULE FUNCTION
CREATE OR REPLACE FUNCTION schedule_analytics_refresh()
RETURNS VOID AS $$
BEGIN
    -- This would typically be called by a cron job or scheduled task
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.user_wardrobe_analytics;
    
    -- Log the refresh
    INSERT INTO public.error_logs (error_type, error_message, context)
    VALUES ('INFO', 'Analytics materialized view refreshed', '{"timestamp": "' || NOW() || '"}');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. ADD DUPLICATE PREVENTION FOR SIMILAR CATEGORIES
CREATE OR REPLACE FUNCTION prevent_duplicate_categories()
RETURNS TRIGGER AS $$
DECLARE
    similar_count INTEGER;
BEGIN
    -- Check for similar category names (basic similarity)
    SELECT COUNT(*) INTO similar_count
    FROM public.clothing_categories
    WHERE is_active = TRUE
    AND (
        lower(name) = lower(NEW.name) OR
        levenshtein(lower(name), lower(NEW.name)) <= 2
    );
    
    IF similar_count > 0 THEN
        RAISE EXCEPTION 'Similar category already exists: %', NEW.name;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for duplicate prevention
CREATE TRIGGER prevent_duplicate_categories_trigger
    BEFORE INSERT ON public.clothing_categories
    FOR EACH ROW EXECUTE FUNCTION prevent_duplicate_categories();

-- Comments
COMMENT ON FUNCTION find_or_create_category IS 'Creates categories with input validation and sanitization';
COMMENT ON FUNCTION cleanup_orphaned_records IS 'Removes orphaned records from junction tables';
COMMENT ON FUNCTION validate_ai_clothing_analysis IS 'Validates AI analysis JSON structure';
COMMENT ON TABLE public.error_logs IS 'System error logging for debugging and monitoring';

-- Migration: 20251021120802_fix_function_search_path.sql

-- ============================================================================
-- FIX FUNCTION SEARCH PATH SECURITY ISSUES
-- Set search_path to empty string for all functions to prevent injection attacks
-- ============================================================================

-- Fix all existing functions by adding SET search_path = ''

-- 1. Update update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column() 
RETURNS TRIGGER AS $$
BEGIN 
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 2. Update find_or_create_category function
CREATE OR REPLACE FUNCTION find_or_create_category(category_name TEXT)
RETURNS UUID AS $$
DECLARE
    category_id UUID;
    clean_name TEXT;
BEGIN
    -- Input validation
    IF category_name IS NULL OR trim(category_name) = '' THEN
        RAISE EXCEPTION 'Category name cannot be null or empty';
    END IF;
    
    IF length(trim(category_name)) > 100 THEN
        RAISE EXCEPTION 'Category name too long (max 100 characters)';
    END IF;
    
    -- Sanitize input
    clean_name := lower(trim(regexp_replace(category_name, '[^a-zA-Z0-9\s\-]', '', 'g')));
    
    -- Try to find existing category
    SELECT id INTO category_id 
    FROM public.clothing_categories 
    WHERE lower(name) = clean_name AND is_active = TRUE;
    
    -- If not found, create as AI suggested (pending approval)
    IF category_id IS NULL THEN
        INSERT INTO public.clothing_categories (name, is_active, source)
        VALUES (clean_name, FALSE, 'ai_suggested')
        RETURNING id INTO category_id;
    END IF;
    
    RETURN category_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 3. Update find_or_create_subcategory function
CREATE OR REPLACE FUNCTION find_or_create_subcategory(subcategory_name TEXT, parent_category_id UUID)
RETURNS UUID AS $$
DECLARE
    subcategory_id UUID;
BEGIN
    -- Try to find existing subcategory
    SELECT id INTO subcategory_id 
    FROM public.clothing_subcategories 
    WHERE name = subcategory_name 
    AND category_id = parent_category_id 
    AND is_active = TRUE;
    
    -- If not found, create as AI suggested
    IF subcategory_id IS NULL THEN
        INSERT INTO public.clothing_subcategories (name, category_id, is_active, source)
        VALUES (subcategory_name, parent_category_id, FALSE, 'ai_suggested')
        RETURNING id INTO subcategory_id;
    END IF;
    
    RETURN subcategory_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 4. Update get_clothing_item_with_categories function
CREATE OR REPLACE FUNCTION get_clothing_item_with_categories(item_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'id', ci.id,
        'name', ci.name,
        'category', CASE 
            WHEN cc.id IS NOT NULL THEN json_build_object('id', cc.id, 'name', cc.name)
            ELSE NULL 
        END,
        'subcategory', CASE 
            WHEN cs.id IS NOT NULL THEN json_build_object('id', cs.id, 'name', cs.name)
            ELSE NULL 
        END,
        'style_tags', COALESCE((
            SELECT json_agg(json_build_object('id', st.id, 'name', st.name))
            FROM public.clothing_item_style_tags cist
            JOIN public.style_tags st ON cist.style_tag_id = st.id
            WHERE cist.clothing_item_id = ci.id
        ), '[]'::json),
        'primary_color', ci.primary_color,
        'secondary_colors', ci.secondary_colors,
        'material', ci.material,
        'pattern', ci.pattern,
        'image_url', ci.image_url,
        'thumbnail_url', ci.thumbnail_url,
        'times_worn', ci.times_worn,
        'is_favorite', ci.is_favorite,
        'created_at', ci.created_at
    ) INTO result
    FROM public.clothing_items ci
    LEFT JOIN public.clothing_categories cc ON ci.category_id = cc.id
    LEFT JOIN public.clothing_subcategories cs ON ci.subcategory_id = cs.id
    WHERE ci.id = item_id;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 5. Update add_style_tags_to_item function
CREATE OR REPLACE FUNCTION add_style_tags_to_item(item_id UUID, tag_names TEXT[])
RETURNS VOID AS $$
DECLARE
    tag_name TEXT;
    tag_id UUID;
BEGIN
    FOREACH tag_name IN ARRAY tag_names
    LOOP
        -- Find or create style tag
        SELECT id INTO tag_id FROM public.style_tags WHERE name = tag_name;
        
        IF tag_id IS NULL THEN
            INSERT INTO public.style_tags (name, source) 
            VALUES (tag_name, 'ai_suggested') 
            RETURNING id INTO tag_id;
        END IF;
        
        -- Link to clothing item (ignore if already exists)
        INSERT INTO public.clothing_item_style_tags (clothing_item_id, style_tag_id)
        VALUES (item_id, tag_id)
        ON CONFLICT DO NOTHING;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 6. Update get_active_categories_for_prompt function
CREATE OR REPLACE FUNCTION get_active_categories_for_prompt()
RETURNS JSON AS $$
BEGIN
    RETURN json_build_object(
        'categories', (
            SELECT json_agg(name ORDER BY display_order)
            FROM public.clothing_categories 
            WHERE is_active = TRUE
        ),
        'subcategories', (
            SELECT json_object_agg(
                cc.name,
                json_agg(cs.name ORDER BY cs.name)
            )
            FROM public.clothing_categories cc
            JOIN public.clothing_subcategories cs ON cc.id = cs.category_id
            WHERE cc.is_active = TRUE AND cs.is_active = TRUE
            GROUP BY cc.name
        ),
        'style_tags', (
            SELECT json_agg(name ORDER BY popularity_score DESC)
            FROM public.style_tags 
            WHERE is_active = TRUE
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 7. Update refresh_wardrobe_analytics function
CREATE OR REPLACE FUNCTION refresh_wardrobe_analytics() 
RETURNS void AS $$
BEGIN 
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.user_wardrobe_analytics;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 8. Update find_similar_items function
CREATE OR REPLACE FUNCTION find_similar_items(
    target_embedding VECTOR(512),
    target_user_id UUID,
    similarity_threshold DECIMAL DEFAULT 0.7,
    limit_count INTEGER DEFAULT 10
) RETURNS TABLE(
    item_id UUID,
    name TEXT,
    category_name TEXT,
    similarity_score DECIMAL
) AS $$
BEGIN 
    RETURN QUERY
SELECT
    ci.id,
    ci.name,
    cc.name,
    (1 - (ci.embedding <=> target_embedding)) :: DECIMAL(3, 2) as similarity
FROM
    public.clothing_items ci
    LEFT JOIN public.clothing_categories cc ON ci.category_id = cc.id
WHERE
    ci.user_id = target_user_id
    AND ci.is_archived = FALSE
    AND ci.deleted_at IS NULL
    AND (1 - (ci.embedding <=> target_embedding)) >= similarity_threshold
ORDER BY
    ci.embedding <=> target_embedding
LIMIT
    limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 9. Update calculate_wardrobe_diversity function
CREATE OR REPLACE FUNCTION calculate_wardrobe_diversity(target_user_id UUID) 
RETURNS DECIMAL AS $$
DECLARE 
    diversity_score DECIMAL;
BEGIN
SELECT
    (
        COUNT(DISTINCT ci.category_id) * 10 + 
        COUNT(DISTINCT ci.primary_color) * 5 + 
        COUNT(DISTINCT ci.subcategory_id) * 3 + 
        CASE
            WHEN COUNT(DISTINCT season_elem) > 1 THEN 20
            ELSE 0
        END
    ) :: DECIMAL / 100.0 INTO diversity_score
FROM
    public.clothing_items ci
    CROSS JOIN LATERAL unnest(ci.season) AS season_elem
WHERE
    ci.user_id = target_user_id
    AND ci.is_archived = FALSE
    AND ci.deleted_at IS NULL;

    RETURN LEAST(diversity_score, 1.0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 10. Update get_trending_categories_for_season function
CREATE OR REPLACE FUNCTION get_trending_categories_for_season(target_season season, target_year INTEGER)
RETURNS JSON AS $$
BEGIN
    RETURN (
        SELECT json_agg(
            json_build_object(
                'id', cc.id,
                'name', cc.name,
                'trend_description', st.trend_description
            )
        )
        FROM public.seasonal_trends st
        JOIN public.seasonal_trend_categories stc ON st.id = stc.trend_id
        JOIN public.clothing_categories cc ON stc.category_id = cc.id
        WHERE st.season = target_season 
        AND st.year = target_year
        AND CURRENT_DATE BETWEEN st.valid_from AND st.valid_until
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 11. Update add_trending_categories_to_trend function
CREATE OR REPLACE FUNCTION add_trending_categories_to_trend(
    trend_id UUID, 
    category_names TEXT[]
)
RETURNS VOID AS $$
DECLARE
    category_name TEXT;
    category_id UUID;
BEGIN
    FOREACH category_name IN ARRAY category_names
    LOOP
        -- Find or create category
        SELECT id INTO category_id 
        FROM public.clothing_categories 
        WHERE name = category_name;
        
        IF category_id IS NULL THEN
            INSERT INTO public.clothing_categories (name, source) 
            VALUES (category_name, 'trend_analysis') 
            RETURNING id INTO category_id;
        END IF;
        
        -- Link to trend (ignore if already exists)
        INSERT INTO public.seasonal_trend_categories (trend_id, category_id)
        VALUES (trend_id, category_id)
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    -- Update the array column for backward compatibility
    UPDATE public.seasonal_trends 
    SET trending_category_ids = (
        SELECT array_agg(stc.category_id)
        FROM public.seasonal_trend_categories stc
        WHERE stc.trend_id = add_trending_categories_to_trend.trend_id
    )
    WHERE id = add_trending_categories_to_trend.trend_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 12. Update all security-related functions
CREATE OR REPLACE FUNCTION check_category_creation_rate_limit(target_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    recent_count INTEGER;
BEGIN
    -- Check if user has created more than 10 categories in the last hour
    SELECT COUNT(*) INTO recent_count
    FROM public.category_creation_log
    WHERE user_id = target_user_id
    AND created_at > NOW() - INTERVAL '1 hour';
    
    RETURN recent_count < 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION cleanup_orphaned_records()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
    temp_count INTEGER;
BEGIN
    -- Clean up orphaned style tag associations
    DELETE FROM public.clothing_item_style_tags cist
    WHERE NOT EXISTS (
        SELECT 1 FROM public.clothing_items ci 
        WHERE ci.id = cist.clothing_item_id
    );
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Clean up orphaned seasonal trend categories
    DELETE FROM public.seasonal_trend_categories stc
    WHERE NOT EXISTS (
        SELECT 1 FROM public.seasonal_trends st 
        WHERE st.id = stc.trend_id
    );
    
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_count := deleted_count + temp_count;
    
    -- Log cleanup activity
    INSERT INTO public.category_creation_log (user_id, category_name)
    VALUES ('00000000-0000-0000-0000-000000000000', 'CLEANUP: ' || deleted_count || ' orphaned records removed');
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION validate_ai_clothing_analysis(analysis_json JSONB)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check required fields exist
    IF NOT (analysis_json ? 'name' AND 
            analysis_json ? 'primary_color' AND 
            analysis_json ? 'ai_confidence_score') THEN
        RETURN FALSE;
    END IF;
    
    -- Validate confidence score range
    IF (analysis_json->>'ai_confidence_score')::DECIMAL NOT BETWEEN 0 AND 1 THEN
        RETURN FALSE;
    END IF;
    
    -- Validate name length
    IF length(analysis_json->>'name') > 200 THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = '';

CREATE OR REPLACE FUNCTION log_error(
    target_user_id UUID,
    error_type TEXT,
    error_message TEXT,
    error_context JSONB DEFAULT '{}'
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.error_logs (user_id, error_type, error_message, context)
    VALUES (target_user_id, error_type, error_message, error_context);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION schedule_analytics_refresh()
RETURNS VOID AS $$
BEGIN
    -- This would typically be called by a cron job or scheduled task
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.user_wardrobe_analytics;
    
    -- Log the refresh
    INSERT INTO public.error_logs (error_type, error_message, context)
    VALUES ('INFO', 'Analytics materialized view refreshed', '{"timestamp": "' || NOW() || '"}');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION prevent_duplicate_categories()
RETURNS TRIGGER AS $$
DECLARE
    similar_count INTEGER;
BEGIN
    -- Check for similar category names (basic similarity)
    SELECT COUNT(*) INTO similar_count
    FROM public.clothing_categories
    WHERE is_active = TRUE
    AND (
        lower(name) = lower(NEW.name) OR
        levenshtein(lower(name), lower(NEW.name)) <= 2
    );
    
    IF similar_count > 0 THEN
        RAISE EXCEPTION 'Similar category already exists: %', NEW.name;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- Migration completed: Fixed search_path security vulnerability in all functions

-- Migration: 20251021122526_move_vector_extension_to_extensions_schema.sql

-- Move vector extension from public schema to dedicated extensions schema
-- This improves security by isolating extensions from application data

-- Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Grant usage on extensions schema to authenticated users
GRANT USAGE ON SCHEMA extensions TO authenticated;
GRANT USAGE ON SCHEMA extensions TO service_role;

-- Since vector extension is already installed in public schema and has dependencies,
-- we'll create a new installation in extensions schema and update references
-- The public schema version will be cleaned up in a future migration after all dependencies are updated

-- Install vector extension in extensions schema (this will coexist with public version temporarily)
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- Add comment to track this migration
COMMENT ON SCHEMA extensions IS 'Dedicated schema for PostgreSQL extensions to improve security isolation';

-- Migration: 20251021123027_properly_move_vector_extension.sql

-- Properly move vector extension from public to extensions schema
-- This requires updating the extension's schema directly

ALTER EXTENSION vector SET SCHEMA extensions;

-- Migration: 20251028090000_fix_subcategory_rpc.sql

-- Fix find_or_create_subcategory to handle duplicates properly
CREATE OR REPLACE FUNCTION find_or_create_subcategory(subcategory_name TEXT, parent_category_id UUID)
RETURNS UUID AS $$
DECLARE
    subcategory_id UUID;
BEGIN
    -- Try to find existing subcategory first
    SELECT id INTO subcategory_id 
    FROM public.clothing_subcategories 
    WHERE name = subcategory_name 
    AND category_id = parent_category_id 
    AND is_active = TRUE;
    
    -- If found, return it
    IF subcategory_id IS NOT NULL THEN
        RETURN subcategory_id;
    END IF;
    
    -- If not found, try to create it with ON CONFLICT handling
    INSERT INTO public.clothing_subcategories (name, category_id, is_active, source)
    VALUES (subcategory_name, parent_category_id, FALSE, 'ai_suggested')
    ON CONFLICT (name, category_id) DO UPDATE SET
        is_active = EXCLUDED.is_active,
        source = EXCLUDED.source
    RETURNING id INTO subcategory_id;
    
    RETURN subcategory_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Migration: 20251028091000_fix_embedding_dimensions.sql

-- Fix embedding column to match Gemini's 768 dimensions
ALTER TABLE clothing_items ALTER COLUMN embedding TYPE vector(768);

-- Migration: 20251028092000_fix_sustainability_score_type.sql

-- Fix sustainability_score to use decimal instead of integer
-- The materialized view will be recreated by migration 20251202000003_fix_remaining_enums.sql
DROP MATERIALIZED VIEW IF EXISTS user_wardrobe_analytics;

-- Alter the column type
ALTER TABLE clothing_items ALTER COLUMN sustainability_score TYPE DECIMAL(3,2);

-- Migration: 20251028093000_add_subscription_system.sql

-- ============================================================================
-- SUBSCRIPTION AND PAYMENT SYSTEM
-- Supports freemium model with trials, referrals, and international payments
-- ============================================================================

-- Subscription plans (Free, Premium, Pro)
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'USD',
    billing_interval TEXT NOT NULL CHECK (billing_interval IN ('month', 'year')),
    trial_days INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Plan limits (flexible approach)
CREATE TABLE plan_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
    limit_type TEXT NOT NULL, -- 'uploads', 'recs_per_week', 'tryons_per_month', etc.
    limit_value INTEGER NOT NULL,
    period TEXT NOT NULL DEFAULT 'total', -- 'total', 'week', 'month', 'year'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User subscriptions
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'unpaid')),
    stripe_subscription_id TEXT UNIQUE,
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    trial_end_date TIMESTAMP WITH TIME ZONE,
    billing_currency TEXT NOT NULL DEFAULT 'USD',
    grandfathered BOOLEAN DEFAULT FALSE,
    canceled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment tracking
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID REFERENCES subscriptions(id),
    user_id UUID NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
    payment_type TEXT NOT NULL DEFAULT 'subscription' CHECK (payment_type IN ('subscription', 'credit', 'refund')),
    stripe_payment_intent_id TEXT,
    stripe_invoice_id TEXT,
    paid_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    failure_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Referral system
CREATE TABLE referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL,
    referee_id UUID NOT NULL,
    referral_code TEXT NOT NULL UNIQUE,
    reward_type TEXT NOT NULL DEFAULT 'credit' CHECK (reward_type IN ('credit', 'cash', 'discount')),
    reward_value DECIMAL(10,2) NOT NULL,
    reward_currency TEXT NOT NULL DEFAULT 'USD',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'paid', 'expired')),
    completed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User credits and discounts
CREATE TABLE user_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    credit_type TEXT NOT NULL CHECK (credit_type IN ('referral', 'promo', 'refund', 'bonus')),
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    source_id UUID, -- referral_id or discount_code_id
    description TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    used_at TIMESTAMP WITH TIME ZONE,
    used_for_payment_id UUID REFERENCES payments(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Discount codes
CREATE TABLE discount_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
    discount_value DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    max_uses INTEGER,
    current_uses INTEGER DEFAULT 0,
    applies_to_plans UUID[], -- Array of plan IDs
    minimum_amount DECIMAL(10,2),
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valid_until TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Usage tracking for plan limits
CREATE TABLE usage_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    usage_type TEXT NOT NULL, -- 'uploads', 'recs', 'tryons', etc.
    usage_count INTEGER DEFAULT 1,
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_plan_limits_plan_id ON plan_limits(plan_id);
CREATE INDEX idx_plan_limits_type ON plan_limits(limit_type);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_subscription_id ON payments(subscription_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX idx_referrals_referee ON referrals(referee_id);
CREATE INDEX idx_referrals_code ON referrals(referral_code);
CREATE INDEX idx_user_credits_user_id ON user_credits(user_id);
CREATE INDEX idx_user_credits_used ON user_credits(used_at);
CREATE INDEX idx_usage_tracking_user_type ON usage_tracking(user_id, usage_type);
CREATE INDEX idx_usage_tracking_period ON usage_tracking(period_start, period_end);

-- Currency support will be added by later migrations
-- user_profiles: preferred_currency, billing_currency added in 20251202000003
-- clothing_items: currency field added here
ALTER TABLE clothing_items 
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON subscription_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Migration: 20251028093001_seed_subscription_plans.sql

-- ============================================================================
-- SEED SUBSCRIPTION PLANS AND LIMITS
-- Initial freemium pricing structure
-- ============================================================================

-- Insert subscription plans
INSERT INTO subscription_plans (name, description, price, currency, billing_interval, trial_days, display_order) VALUES
('Free', 'Perfect for casual users getting started', 0.00, 'USD', 'month', 0, 1),
('Premium', 'Unlimited AI recommendations and advanced features', 4.99, 'USD', 'month', 14, 2),
('Premium Annual', 'Premium plan with 20% annual discount', 49.99, 'USD', 'year', 14, 3),
('Pro', 'Everything in Premium plus social sharing and API access', 9.99, 'USD', 'month', 14, 4),
('Pro Annual', 'Pro plan with 20% annual discount', 99.99, 'USD', 'year', 14, 5);

-- Get plan IDs for limits
DO $$
DECLARE
    free_plan_id UUID;
    premium_monthly_id UUID;
    premium_annual_id UUID;
    pro_monthly_id UUID;
    pro_annual_id UUID;
BEGIN
    -- Get plan IDs
    SELECT id INTO free_plan_id FROM subscription_plans WHERE name = 'Free';
    SELECT id INTO premium_monthly_id FROM subscription_plans WHERE name = 'Premium';
    SELECT id INTO premium_annual_id FROM subscription_plans WHERE name = 'Premium Annual';
    SELECT id INTO pro_monthly_id FROM subscription_plans WHERE name = 'Pro';
    SELECT id INTO pro_annual_id FROM subscription_plans WHERE name = 'Pro Annual';
    
    -- Free plan limits
    INSERT INTO plan_limits (plan_id, limit_type, limit_value, period) VALUES
    (free_plan_id, 'uploads', 10, 'total'),
    (free_plan_id, 'recs', 3, 'week'),
    (free_plan_id, 'tryons', 1, 'month'),
    (free_plan_id, 'storage_gb', 1, 'total');
    
    -- Premium monthly limits (unlimited = -1)
    INSERT INTO plan_limits (plan_id, limit_type, limit_value, period) VALUES
    (premium_monthly_id, 'uploads', -1, 'total'),
    (premium_monthly_id, 'recs', -1, 'week'),
    (premium_monthly_id, 'tryons', -1, 'month'),
    (premium_monthly_id, 'storage_gb', 10, 'total'),
    (premium_monthly_id, 'api_calls', 1000, 'month');
    
    -- Premium annual limits (same as monthly)
    INSERT INTO plan_limits (plan_id, limit_type, limit_value, period) VALUES
    (premium_annual_id, 'uploads', -1, 'total'),
    (premium_annual_id, 'recs', -1, 'week'),
    (premium_annual_id, 'tryons', -1, 'month'),
    (premium_annual_id, 'storage_gb', 10, 'total'),
    (premium_annual_id, 'api_calls', 1000, 'month');
    
    -- Pro monthly limits
    INSERT INTO plan_limits (plan_id, limit_type, limit_value, period) VALUES
    (pro_monthly_id, 'uploads', -1, 'total'),
    (pro_monthly_id, 'recs', -1, 'week'),
    (pro_monthly_id, 'tryons', -1, 'month'),
    (pro_monthly_id, 'storage_gb', 50, 'total'),
    (pro_monthly_id, 'api_calls', 10000, 'month'),
    (pro_monthly_id, 'social_sharing', -1, 'total'),
    (pro_monthly_id, 'custom_prompts', -1, 'total');
    
    -- Pro annual limits (same as monthly)
    INSERT INTO plan_limits (plan_id, limit_type, limit_value, period) VALUES
    (pro_annual_id, 'uploads', -1, 'total'),
    (pro_annual_id, 'recs', -1, 'week'),
    (pro_annual_id, 'tryons', -1, 'month'),
    (pro_annual_id, 'storage_gb', 50, 'total'),
    (pro_annual_id, 'api_calls', 10000, 'month'),
    (pro_annual_id, 'social_sharing', -1, 'total'),
    (pro_annual_id, 'custom_prompts', -1, 'total');
END $$;

-- Migration: 20251028094000_add_currency_support.sql

-- ============================================================================
-- CURRENCY SUPPORT FOR INTERNATIONAL USERS
-- Add currency fields and exchange rate caching
-- ============================================================================

-- Common currency codes for validation (create first)
CREATE TABLE public.supported_currencies (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    symbol TEXT,
    decimal_places INTEGER DEFAULT 2,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 999
);

-- Exchange rates table for currency conversion caching
CREATE TABLE exchange_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    base_currency TEXT NOT NULL DEFAULT 'USD',
    target_currency TEXT NOT NULL,
    rate DECIMAL(12,6) NOT NULL,
    provider TEXT DEFAULT 'exchangerate-api', -- API provider used
    rate_date DATE DEFAULT CURRENT_DATE, -- Date for daily rates
    fetched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valid_until TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
    update_frequency TEXT DEFAULT 'daily', -- 'daily', 'hourly', '15min', 'realtime'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Currency conversion function
CREATE OR REPLACE FUNCTION convert_currency(
    amount DECIMAL(10,2),
    from_currency TEXT,
    to_currency TEXT
) RETURNS DECIMAL(10,2) AS $$
DECLARE
    conversion_rate DECIMAL(12,6);
    converted_amount DECIMAL(10,2);
BEGIN
    -- If same currency, return original amount
    IF from_currency = to_currency THEN
        RETURN amount;
    END IF;
    
    -- Get latest exchange rate
    SELECT rate INTO conversion_rate
    FROM exchange_rates
    WHERE base_currency = from_currency 
    AND target_currency = to_currency
    AND valid_until > NOW()
    AND is_active = TRUE
    ORDER BY fetched_at DESC
    LIMIT 1;
    
    -- If no rate found, return original amount (fallback)
    IF conversion_rate IS NULL THEN
        RETURN amount;
    END IF;
    
    -- Calculate converted amount
    converted_amount := amount * conversion_rate;
    
    RETURN ROUND(converted_amount, 2);
END;
$$ LANGUAGE plpgsql STABLE SET search_path = '';

-- Function to get user's preferred currency
CREATE OR REPLACE FUNCTION get_user_preferred_currency(target_user_id UUID)
RETURNS TEXT AS $$
DECLARE
    user_currency TEXT;
BEGIN
    -- This will work after migration 20251202000003 adds the column
    SELECT COALESCE(preferred_currency, 'USD') INTO user_currency
    FROM user_profiles
    WHERE user_id = target_user_id;
    
    RETURN COALESCE(user_currency, 'USD');
EXCEPTION WHEN undefined_column THEN
    -- Fallback if column doesn't exist yet
    RETURN 'USD';
END;
$$ LANGUAGE plpgsql STABLE SET search_path = '';

-- Indexes for performance
CREATE INDEX idx_exchange_rates_currencies ON exchange_rates(base_currency, target_currency);
CREATE INDEX idx_exchange_rates_valid ON exchange_rates(valid_until) WHERE is_active = TRUE;
CREATE INDEX idx_exchange_rates_fetched ON exchange_rates(fetched_at DESC);

-- Unique constraint: one rate per currency pair per day
CREATE UNIQUE INDEX idx_exchange_rates_daily_unique 
ON exchange_rates(base_currency, target_currency, rate_date);

-- Insert common currencies (prioritizing African currencies)
INSERT INTO public.supported_currencies (code, name, symbol, display_order) VALUES
-- Major Global Currencies
('USD', 'US Dollar', '$', 1),
('EUR', 'Euro', '€', 2),
('GBP', 'British Pound', '£', 3),

-- African Currencies (Priority)
('ZAR', 'South African Rand', 'R', 4),
('NGN', 'Nigerian Naira', '₦', 5),
('KES', 'Kenyan Shilling', 'KSh', 6),
('GHS', 'Ghanaian Cedi', '₵', 7),
('EGP', 'Egyptian Pound', '£', 8),
('MAD', 'Moroccan Dirham', 'د.م.', 9),
('TND', 'Tunisian Dinar', 'د.ت', 10),
('ETB', 'Ethiopian Birr', 'Br', 11),
('UGX', 'Ugandan Shilling', 'USh', 12),
('TZS', 'Tanzanian Shilling', 'TSh', 13),
('RWF', 'Rwandan Franc', 'FRw', 14),
('ZMW', 'Zambian Kwacha', 'ZK', 15),
('BWP', 'Botswana Pula', 'P', 16),
('MUR', 'Mauritian Rupee', '₨', 17),
('AOA', 'Angolan Kwanza', 'Kz', 18),
('MZN', 'Mozambican Metical', 'MT', 19),
('NAD', 'Namibian Dollar', 'N$', 20),
('SZL', 'Swazi Lilangeni', 'L', 21),
('LSL', 'Lesotho Loti', 'L', 22),
('MWK', 'Malawian Kwacha', 'MK', 23),
('ZWL', 'Zimbabwean Dollar', 'Z$', 24),
('BIF', 'Burundian Franc', 'FBu', 25),
('DJF', 'Djiboutian Franc', 'Fdj', 26),
('ERN', 'Eritrean Nakfa', 'Nfk', 27),
('GMD', 'Gambian Dalasi', 'D', 28),
('GNF', 'Guinean Franc', 'FG', 29),
('LRD', 'Liberian Dollar', 'L$', 30),
('MGA', 'Malagasy Ariary', 'Ar', 31),
('MLI', 'Malian Franc', 'CFA', 32),
('SLL', 'Sierra Leonean Leone', 'Le', 33),
('SOS', 'Somali Shilling', 'S', 34),
('SDP', 'Sudanese Pound', '£', 35),
('STD', 'São Tomé and Príncipe Dobra', 'Db', 36),
('SVC', 'Salvadoran Colón', '₡', 37),
('CVE', 'Cape Verdean Escudo', '$', 38),
('KMF', 'Comorian Franc', 'CF', 39),
('SCR', 'Seychellois Rupee', '₨', 40),

-- West/Central African CFA Franc (shared currency)
('XOF', 'West African CFA Franc', 'CFA', 41),
('XAF', 'Central African CFA Franc', 'FCFA', 42),

-- Other Major Currencies
('JPY', 'Japanese Yen', '¥', 50),
('CAD', 'Canadian Dollar', 'C$', 51),
('AUD', 'Australian Dollar', 'A$', 52),
('CHF', 'Swiss Franc', 'CHF', 53),
('CNY', 'Chinese Yuan', '¥', 54),
('INR', 'Indian Rupee', '₹', 55),
('BRL', 'Brazilian Real', 'R$', 56),
('MXN', 'Mexican Peso', '$', 57),
('SGD', 'Singapore Dollar', 'S$', 58),
('HKD', 'Hong Kong Dollar', 'HK$', 59),
('NOK', 'Norwegian Krone', 'kr', 60),
('SEK', 'Swedish Krona', 'kr', 61),
('DKK', 'Danish Krone', 'kr', 62),
('PLN', 'Polish Zloty', 'zł', 63),
('CZK', 'Czech Koruna', 'Kč', 64),
('HUF', 'Hungarian Forint', 'Ft', 65),
('RUB', 'Russian Ruble', '₽', 66),
('KRW', 'South Korean Won', '₩', 67),
('THB', 'Thai Baht', '฿', 68),
('MYR', 'Malaysian Ringgit', 'RM', 69),
('IDR', 'Indonesian Rupiah', 'Rp', 70),
('PHP', 'Philippine Peso', '₱', 71),
('VND', 'Vietnamese Dong', '₫', 72),
('TRY', 'Turkish Lira', '₺', 73),
('ILS', 'Israeli Shekel', '₪', 74),
('AED', 'UAE Dirham', 'د.إ', 75);

COMMENT ON TABLE exchange_rates IS 'Cached currency exchange rates for international pricing display';
COMMENT ON TABLE public.supported_currencies IS 'List of supported currencies with display information';
COMMENT ON FUNCTION convert_currency IS 'Converts amounts between currencies using cached exchange rates';

-- Migration: 20251028095000_ensure_currency_subscription_consistency.sql

-- ============================================================================
-- ENSURE CURRENCY AND SUBSCRIPTION CONSISTENCY ACROSS DATABASE
-- Fix all compatibility issues between existing schema and new features
-- ============================================================================

-- 1. Add missing currency fields to user_profiles (if not already added by later migrations)
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS preferred_currency TEXT DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS billing_currency TEXT DEFAULT 'USD';

-- 2. Ensure clothing_items has currency support
ALTER TABLE clothing_items 
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';

-- 3. Add currency support to wardrobe_gaps (for estimated_cost)
ALTER TABLE wardrobe_gaps 
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';

-- 4. Add currency support to outfit_collections (for cost tracking)
ALTER TABLE outfit_collections 
ADD COLUMN IF NOT EXISTS estimated_cost DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';

-- 5. Add subscription tracking to user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS current_plan_id UUID REFERENCES subscription_plans(id),
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free' CHECK (subscription_status IN ('free', 'trialing', 'active', 'past_due', 'canceled')),
ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMP WITH TIME ZONE;

-- 6. Add usage tracking fields to user_profiles for quick access
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS monthly_uploads_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_recs_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_tryons_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS usage_reset_date TIMESTAMP WITH TIME ZONE DEFAULT date_trunc('month', NOW());

-- 7. Currency validation using triggers (since CHECK constraints can't use subqueries)
CREATE OR REPLACE FUNCTION validate_currency_code()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if currency exists in supported_currencies
    IF NEW.preferred_currency IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM public.supported_currencies 
        WHERE code = NEW.preferred_currency AND is_active = TRUE
    ) THEN
        RAISE EXCEPTION 'Invalid preferred currency code: %', NEW.preferred_currency;
    END IF;
    
    IF NEW.billing_currency IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM public.supported_currencies 
        WHERE code = NEW.billing_currency AND is_active = TRUE
    ) THEN
        RAISE EXCEPTION 'Invalid billing currency code: %', NEW.billing_currency;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

CREATE OR REPLACE FUNCTION validate_item_currency()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if currency exists in supported_currencies
    IF NEW.currency IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM public.supported_currencies 
        WHERE code = NEW.currency AND is_active = TRUE
    ) THEN
        RAISE EXCEPTION 'Invalid currency code: %', NEW.currency;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- Apply triggers
CREATE TRIGGER validate_user_currencies
    BEFORE INSERT OR UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION validate_currency_code();

CREATE TRIGGER validate_clothing_currency
    BEFORE INSERT OR UPDATE ON clothing_items
    FOR EACH ROW EXECUTE FUNCTION validate_item_currency();

CREATE TRIGGER validate_gap_currency
    BEFORE INSERT OR UPDATE ON wardrobe_gaps
    FOR EACH ROW EXECUTE FUNCTION validate_item_currency();

CREATE TRIGGER validate_collection_currency
    BEFORE INSERT OR UPDATE ON outfit_collections
    FOR EACH ROW EXECUTE FUNCTION validate_item_currency();

-- 8. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_currency ON user_profiles(preferred_currency);
CREATE INDEX IF NOT EXISTS idx_user_profiles_billing ON user_profiles(billing_currency);
CREATE INDEX IF NOT EXISTS idx_user_profiles_plan ON user_profiles(current_plan_id);
CREATE INDEX IF NOT EXISTS idx_clothing_items_currency ON clothing_items(currency);
CREATE INDEX IF NOT EXISTS idx_user_profiles_usage_reset ON user_profiles(usage_reset_date);

-- 9. Add RLS policies for subscription tables
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supported_currencies ENABLE ROW LEVEL SECURITY;

-- Subscription plans (public read)
CREATE POLICY "Anyone can view active subscription plans" ON subscription_plans 
FOR SELECT USING (is_active = TRUE);

-- Plan limits (public read)
CREATE POLICY "Anyone can view plan limits" ON plan_limits 
FOR SELECT USING (TRUE);

-- User subscriptions (own data only)
CREATE POLICY "Users can view own subscriptions" ON subscriptions 
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own subscriptions" ON subscriptions 
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own subscriptions" ON subscriptions 
FOR UPDATE USING (user_id = auth.uid());

-- Payments (own data only)
CREATE POLICY "Users can view own payments" ON payments 
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own payments" ON payments 
FOR INSERT WITH CHECK (user_id = auth.uid());

-- Referrals (referrer and referee can view)
CREATE POLICY "Users can view referrals they made or received" ON referrals 
FOR SELECT USING (referrer_id = auth.uid() OR referee_id = auth.uid());

CREATE POLICY "Users can insert referrals they make" ON referrals 
FOR INSERT WITH CHECK (referrer_id = auth.uid());

CREATE POLICY "Users can update referrals they made" ON referrals 
FOR UPDATE USING (referrer_id = auth.uid());

-- User credits (own data only)
CREATE POLICY "Users can view own credits" ON user_credits 
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own credits" ON user_credits 
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own credits" ON user_credits 
FOR UPDATE USING (user_id = auth.uid());

-- Discount codes (public read for active codes)
CREATE POLICY "Anyone can view active discount codes" ON discount_codes 
FOR SELECT USING (is_active = TRUE AND (valid_until IS NULL OR valid_until > NOW()));

-- Usage tracking (own data only)
CREATE POLICY "Users can view own usage" ON usage_tracking 
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own usage" ON usage_tracking 
FOR INSERT WITH CHECK (user_id = auth.uid());

-- Exchange rates (public read)
CREATE POLICY "Anyone can view exchange rates" ON exchange_rates 
FOR SELECT USING (is_active = TRUE);

-- Supported currencies (public read)
CREATE POLICY "Anyone can view supported currencies" ON public.supported_currencies 
FOR SELECT USING (is_active = TRUE);

-- 10. Create helper functions for subscription management
CREATE OR REPLACE FUNCTION get_user_plan_limits(target_user_id UUID, limit_type_param TEXT)
RETURNS INTEGER AS $$
DECLARE
    limit_value INTEGER;
BEGIN
    SELECT pl.limit_value INTO limit_value
    FROM subscriptions s
    JOIN plan_limits pl ON s.plan_id = pl.plan_id
    WHERE s.user_id = target_user_id 
    AND s.status IN ('active', 'trialing')
    AND pl.limit_type = limit_type_param
    ORDER BY s.created_at DESC
    LIMIT 1;
    
    -- Default to free plan limits if no active subscription
    IF limit_value IS NULL THEN
        SELECT pl.limit_value INTO limit_value
        FROM subscription_plans sp
        JOIN plan_limits pl ON sp.id = pl.plan_id
        WHERE sp.name = 'Free' 
        AND pl.limit_type = limit_type_param;
    END IF;
    
    RETURN COALESCE(limit_value, 0);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION check_usage_limit(target_user_id UUID, usage_type_param TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    current_usage INTEGER;
    usage_limit INTEGER;
    period_start TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get usage limit for user's current plan
    usage_limit := get_user_plan_limits(target_user_id, usage_type_param);
    
    -- Unlimited usage (-1)
    IF usage_limit = -1 THEN
        RETURN TRUE;
    END IF;
    
    -- Determine period start based on usage type
    IF usage_type_param LIKE '%_week' THEN
        period_start := date_trunc('week', NOW());
    ELSIF usage_type_param LIKE '%_month' THEN
        period_start := date_trunc('month', NOW());
    ELSE
        period_start := '1970-01-01'::TIMESTAMP WITH TIME ZONE; -- Total usage
    END IF;
    
    -- Get current usage count
    SELECT COALESCE(SUM(usage_count), 0) INTO current_usage
    FROM usage_tracking
    WHERE user_id = target_user_id 
    AND usage_type = usage_type_param
    AND period_start >= period_start;
    
    RETURN current_usage < usage_limit;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '';

-- 11. Update triggers to sync user_profiles with subscription data
CREATE OR REPLACE FUNCTION sync_user_subscription_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update user_profiles when subscription changes
    UPDATE user_profiles 
    SET 
        current_plan_id = NEW.plan_id,
        subscription_status = NEW.status,
        plan_expires_at = NEW.current_period_end
    WHERE user_id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE TRIGGER sync_subscription_status 
AFTER INSERT OR UPDATE ON subscriptions 
FOR EACH ROW EXECUTE FUNCTION sync_user_subscription_status();

-- 12. Add currency conversion helper for display
CREATE OR REPLACE FUNCTION get_converted_amount(
    amount DECIMAL(10,2),
    from_currency TEXT,
    to_currency TEXT,
    target_user_id UUID DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    user_currency TEXT;
    converted_amount DECIMAL(10,2);
    display_currency TEXT;
BEGIN
    -- Get user's preferred currency if user_id provided
    IF target_user_id IS NOT NULL THEN
        SELECT preferred_currency INTO user_currency
        FROM user_profiles 
        WHERE user_id = target_user_id;
        display_currency := COALESCE(user_currency, to_currency);
    ELSE
        display_currency := to_currency;
    END IF;
    
    -- Convert amount
    converted_amount := convert_currency(amount, from_currency, display_currency);
    
    -- Return both original and converted
    RETURN jsonb_build_object(
        'original_amount', amount,
        'original_currency', from_currency,
        'converted_amount', converted_amount,
        'display_currency', display_currency,
        'is_converted', (from_currency != display_currency)
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '';

COMMENT ON FUNCTION get_user_plan_limits IS 'Get usage limits for a user based on their current subscription plan';
COMMENT ON FUNCTION check_usage_limit IS 'Check if user has exceeded their usage limit for a specific feature';
COMMENT ON FUNCTION get_converted_amount IS 'Convert currency amounts for display with user preferences';

-- Migration: 20251028095001_seed_default_subscriptions.sql

-- ============================================================================
-- SEED DEFAULT SUBSCRIPTIONS FOR EXISTING USERS
-- Ensure all existing users have proper subscription and currency setup
-- ============================================================================

-- 1. Set default currencies based on user location (if available)
UPDATE user_profiles 
SET 
    preferred_currency = CASE 
        WHEN location_country = 'South Africa' THEN 'ZAR'
        WHEN location_country = 'Nigeria' THEN 'NGN'
        WHEN location_country = 'Kenya' THEN 'KES'
        WHEN location_country = 'Ghana' THEN 'GHS'
        WHEN location_country = 'Egypt' THEN 'EGP'
        WHEN location_country = 'Morocco' THEN 'MAD'
        WHEN location_country = 'Tunisia' THEN 'TND'
        WHEN location_country = 'Ethiopia' THEN 'ETB'
        WHEN location_country = 'Uganda' THEN 'UGX'
        WHEN location_country = 'Tanzania' THEN 'TZS'
        WHEN location_country = 'Rwanda' THEN 'RWF'
        WHEN location_country = 'Zambia' THEN 'ZMW'
        WHEN location_country = 'Botswana' THEN 'BWP'
        WHEN location_country = 'Mauritius' THEN 'MUR'
        WHEN location_country = 'United Kingdom' THEN 'GBP'
        WHEN location_country IN ('Germany', 'France', 'Italy', 'Spain', 'Netherlands') THEN 'EUR'
        WHEN location_country = 'Canada' THEN 'CAD'
        WHEN location_country = 'Australia' THEN 'AUD'
        WHEN location_country = 'Japan' THEN 'JPY'
        WHEN location_country = 'India' THEN 'INR'
        WHEN location_country = 'Brazil' THEN 'BRL'
        ELSE 'USD'
    END,
    billing_currency = CASE 
        WHEN location_country = 'South Africa' THEN 'ZAR'
        WHEN location_country = 'Nigeria' THEN 'NGN'
        WHEN location_country = 'Kenya' THEN 'KES'
        WHEN location_country = 'Ghana' THEN 'GHS'
        WHEN location_country = 'Egypt' THEN 'EGP'
        WHEN location_country = 'Morocco' THEN 'MAD'
        WHEN location_country = 'Tunisia' THEN 'TND'
        WHEN location_country = 'Ethiopia' THEN 'ETB'
        WHEN location_country = 'Uganda' THEN 'UGX'
        WHEN location_country = 'Tanzania' THEN 'TZS'
        WHEN location_country = 'Rwanda' THEN 'RWF'
        WHEN location_country = 'Zambia' THEN 'ZMW'
        WHEN location_country = 'Botswana' THEN 'BWP'
        WHEN location_country = 'Mauritius' THEN 'MUR'
        WHEN location_country = 'United Kingdom' THEN 'GBP'
        WHEN location_country IN ('Germany', 'France', 'Italy', 'Spain', 'Netherlands') THEN 'EUR'
        WHEN location_country = 'Canada' THEN 'CAD'
        WHEN location_country = 'Australia' THEN 'AUD'
        WHEN location_country = 'Japan' THEN 'JPY'
        WHEN location_country = 'India' THEN 'INR'
        WHEN location_country = 'Brazil' THEN 'BRL'
        ELSE 'USD'
    END
WHERE preferred_currency IS NULL OR billing_currency IS NULL;

-- 2. Create free subscriptions for all existing users without subscriptions
DO $$
DECLARE
    free_plan_id UUID;
    user_record RECORD;
BEGIN
    -- Get the Free plan ID
    SELECT id INTO free_plan_id FROM subscription_plans WHERE name = 'Free';
    
    -- Create free subscriptions for users who don't have any
    FOR user_record IN 
        SELECT up.user_id 
        FROM user_profiles up
        LEFT JOIN subscriptions s ON up.user_id = s.user_id
        WHERE s.user_id IS NULL
    LOOP
        INSERT INTO subscriptions (
            user_id, 
            plan_id, 
            status, 
            current_period_start, 
            current_period_end,
            billing_currency
        ) VALUES (
            user_record.user_id,
            free_plan_id,
            'active',
            NOW(),
            NOW() + INTERVAL '1 year', -- Free plan doesn't expire
            (SELECT billing_currency FROM user_profiles WHERE user_id = user_record.user_id)
        );
    END LOOP;
END $$;

-- 3. Update user_profiles with current subscription info
UPDATE user_profiles 
SET 
    current_plan_id = s.plan_id,
    subscription_status = s.status,
    plan_expires_at = s.current_period_end
FROM subscriptions s
WHERE user_profiles.user_id = s.user_id
AND user_profiles.current_plan_id IS NULL;

-- 4. Set default currency for existing clothing items
UPDATE clothing_items 
SET currency = up.preferred_currency
FROM user_profiles up
WHERE clothing_items.user_id = up.user_id
AND clothing_items.currency IS NULL;

-- 5. Reset usage counters for all users (start fresh)
UPDATE user_profiles 
SET 
    monthly_uploads_used = 0,
    monthly_recs_used = 0,
    monthly_tryons_used = 0,
    usage_reset_date = date_trunc('month', NOW());

-- 6. Create initial exchange rates (placeholder - will be updated by API)
INSERT INTO exchange_rates (base_currency, target_currency, rate, provider, update_frequency) VALUES
('USD', 'ZAR', 18.50, 'placeholder', 'daily'),
('USD', 'NGN', 1650.00, 'placeholder', 'daily'),
('USD', 'KES', 129.00, 'placeholder', 'daily'),
('USD', 'GHS', 15.80, 'placeholder', 'daily'),
('USD', 'EGP', 49.00, 'placeholder', 'daily'),
('USD', 'EUR', 0.85, 'placeholder', 'daily'),
('USD', 'GBP', 0.73, 'placeholder', 'daily'),
('USD', 'CAD', 1.35, 'placeholder', 'daily'),
('USD', 'AUD', 1.55, 'placeholder', 'daily'),
('USD', 'JPY', 150.00, 'placeholder', 'daily'),
('USD', 'INR', 83.00, 'placeholder', 'daily'),
('USD', 'BRL', 5.20, 'placeholder', 'daily')
ON CONFLICT (base_currency, target_currency, rate_date) DO NOTHING;

-- Migration complete: Seeds default subscriptions and currency settings for existing users based on their location

-- Migration: 20251028096000_fix_remaining_search_path_issues.sql

-- ============================================================================
-- FIX REMAINING SEARCH PATH SECURITY ISSUES
-- Update all functions that still lack proper search_path settings
-- ============================================================================

-- Fix update_updated_at_column function from initial schema
CREATE OR REPLACE FUNCTION update_updated_at_column() 
RETURNS TRIGGER AS $$
BEGIN 
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- Fix normalize_enum_value function from 20251202000003
CREATE OR REPLACE FUNCTION normalize_enum_value(input_value TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN lower(trim(replace(replace(input_value, '-', '_'), ' ', '_')));
END;
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = '';

-- Fix create_user_profile function from 20251201000000
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (user_id, created_at, updated_at)
    VALUES (NEW.id, NOW(), NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Fix refresh_wardrobe_analytics function from initial schema
CREATE OR REPLACE FUNCTION refresh_wardrobe_analytics() 
RETURNS void AS $$
BEGIN 
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.user_wardrobe_analytics;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Fix find_similar_items function from initial schema
CREATE OR REPLACE FUNCTION find_similar_items(
    target_embedding VECTOR(768),
    target_user_id UUID,
    similarity_threshold DECIMAL DEFAULT 0.7,
    limit_count INTEGER DEFAULT 10
) RETURNS TABLE(
    item_id UUID,
    name TEXT,
    category_name TEXT,
    similarity_score DECIMAL
) AS $$
BEGIN 
    RETURN QUERY
SELECT
    ci.id,
    ci.name,
    cc.name,
    (1 - (ci.embedding <=> target_embedding)) :: DECIMAL(3, 2) as similarity
FROM
    public.clothing_items ci
    LEFT JOIN public.clothing_categories cc ON ci.category_id = cc.id
WHERE
    ci.user_id = target_user_id
    AND ci.is_archived = FALSE
    AND ci.deleted_at IS NULL
    AND (1 - (ci.embedding <=> target_embedding)) >= similarity_threshold
ORDER BY
    ci.embedding <=> target_embedding
LIMIT
    limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Fix calculate_wardrobe_diversity function from initial schema
CREATE OR REPLACE FUNCTION calculate_wardrobe_diversity(target_user_id UUID) 
RETURNS DECIMAL AS $$
DECLARE 
    diversity_score DECIMAL;
BEGIN
SELECT
    (
        COUNT(DISTINCT ci.category_id) * 10 + 
        COUNT(DISTINCT ci.primary_color) * 5 + 
        COUNT(DISTINCT ci.subcategory_id) * 3 + 
        CASE
            WHEN COUNT(DISTINCT season_elem) > 1 THEN 20
            ELSE 0
        END
    ) :: DECIMAL / 100.0 INTO diversity_score
FROM
    public.clothing_items ci
    CROSS JOIN LATERAL unnest(ci.season_names) AS season_elem
WHERE
    ci.user_id = target_user_id
    AND ci.is_archived = FALSE
    AND ci.deleted_at IS NULL;

    RETURN LEAST(diversity_score, 1.0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Migration complete: Fixes remaining search_path security issues in existing functions

-- Migration: 20251201000000_add_user_profile_trigger.sql

-- Create function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (user_id, created_at, updated_at)
    VALUES (NEW.id, NOW(), NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Create trigger to run after user is created in auth.users
CREATE TRIGGER create_user_profile_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_user_profile();

COMMENT ON FUNCTION create_user_profile IS 'Automatically creates user profile when new user signs up';

-- Migration: 20251202000000_create_storage_bucket.sql

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

-- Migration: 20251202000001_add_levenshtein_function.sql

-- Add levenshtein function for category matching
-- The fuzzystrmatch extension provides levenshtein function
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch WITH SCHEMA extensions;

-- Migration: 20251202000002_fix_enum_issues.sql

-- ============================================================================
-- FIX ENUM ISSUES - Convert to dynamic tables for better flexibility
-- ============================================================================

-- Create seasons table (dynamic like categories)
CREATE TABLE public.seasons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert season data with consistent naming
INSERT INTO public.seasons (name, display_name, display_order) VALUES
('spring', 'Spring', 1),
('summer', 'Summer', 2),
('fall', 'Fall', 3),
('winter', 'Winter', 4),
('all_season', 'All Season', 5);

-- Create fit preferences table
CREATE TABLE public.fit_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert fit preference data
INSERT INTO public.fit_preferences (name, display_name, display_order) VALUES
('tight', 'Tight', 1),
('fitted', 'Fitted', 2),
('regular', 'Regular', 3),
('loose', 'Loose', 4),
('oversized', 'Oversized', 5);

-- Add new columns to clothing_items
ALTER TABLE public.clothing_items 
ADD COLUMN season_names TEXT[] DEFAULT '{}',
ADD COLUMN fit_name TEXT DEFAULT 'regular';

-- Migrate existing data (convert enum arrays to text arrays)
UPDATE public.clothing_items 
SET season_names = ARRAY(
    SELECT unnest(season)::text
), fit_name = fit::text;

-- Drop old enum columns
ALTER TABLE public.clothing_items 
DROP COLUMN season,
DROP COLUMN fit;

-- Update user_profiles fit preference
ALTER TABLE public.user_profiles 
ADD COLUMN preferred_fit_name TEXT DEFAULT 'regular';

UPDATE public.user_profiles 
SET preferred_fit_name = preferred_fit::text;

ALTER TABLE public.user_profiles 
DROP COLUMN preferred_fit;

-- Create RPC functions for season management
CREATE OR REPLACE FUNCTION find_or_create_season(season_name TEXT)
RETURNS UUID AS $$
DECLARE
    season_id UUID;
    clean_name TEXT;
BEGIN
    -- Clean and normalize the season name
    clean_name := lower(trim(season_name));
    clean_name := replace(clean_name, '-', '_');
    clean_name := replace(clean_name, ' ', '_');
    
    -- Try to find existing season
    SELECT id INTO season_id 
    FROM public.seasons 
    WHERE name = clean_name;
    
    -- Create if not found
    IF season_id IS NULL THEN
        INSERT INTO public.seasons (name, display_name) 
        VALUES (clean_name, initcap(replace(clean_name, '_', ' ')))
        RETURNING id INTO season_id;
    END IF;
    
    RETURN season_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Create RPC function for fit preference management
CREATE OR REPLACE FUNCTION find_or_create_fit_preference(fit_name TEXT)
RETURNS UUID AS $$
DECLARE
    fit_id UUID;
    clean_name TEXT;
BEGIN
    -- Clean and normalize the fit name
    clean_name := lower(trim(fit_name));
    
    -- Try to find existing fit preference
    SELECT id INTO fit_id 
    FROM public.fit_preferences 
    WHERE name = clean_name;
    
    -- Create if not found
    IF fit_id IS NULL THEN
        INSERT INTO public.fit_preferences (name, display_name) 
        VALUES (clean_name, initcap(clean_name))
        RETURNING id INTO fit_id;
    END IF;
    
    RETURN fit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Add indexes
CREATE INDEX idx_seasons_name ON public.seasons(name);
CREATE INDEX idx_seasons_active ON public.seasons(is_active);
CREATE INDEX idx_fit_preferences_name ON public.fit_preferences(name);
CREATE INDEX idx_fit_preferences_active ON public.fit_preferences(is_active);
CREATE INDEX idx_clothing_season_names ON public.clothing_items USING GIN(season_names);
CREATE INDEX idx_clothing_fit_name ON public.clothing_items(fit_name);

-- Enable RLS
ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fit_preferences ENABLE ROW LEVEL SECURITY;

-- Public read access for reference tables
CREATE POLICY "Anyone can view seasons" ON public.seasons FOR SELECT USING (true);
CREATE POLICY "Anyone can view fit preferences" ON public.fit_preferences FOR SELECT USING (true);

-- Update seasonal_trends table
ALTER TABLE public.seasonal_trends 
ADD COLUMN season_name TEXT;

-- Migrate existing season enum data
UPDATE public.seasonal_trends 
SET season_name = season::text;

-- Drop old enum column
ALTER TABLE public.seasonal_trends 
DROP COLUMN season;

-- Update outfit_recommendations table
ALTER TABLE public.outfit_recommendations 
ADD COLUMN season_name TEXT;

-- Migrate existing season enum data
UPDATE public.outfit_recommendations 
SET season_name = season::text;

-- Drop old enum column
ALTER TABLE public.outfit_recommendations 
DROP COLUMN season;

-- Update function signature to use TEXT instead of season enum
CREATE OR REPLACE FUNCTION get_trending_categories_for_season(target_season TEXT, target_year INTEGER)
RETURNS JSON AS $$
BEGIN
    RETURN (
        SELECT json_agg(
            json_build_object(
                'id', cc.id,
                'name', cc.name,
                'trend_description', st.trend_description
            )
        )
        FROM public.seasonal_trends st
        JOIN public.seasonal_trend_categories stc ON st.id = stc.trend_id
        JOIN public.clothing_categories cc ON stc.category_id = cc.id
        WHERE st.season_name = target_season 
        AND st.year = target_year
        AND CURRENT_DATE BETWEEN st.valid_from AND st.valid_until
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Update diversity calculation function
CREATE OR REPLACE FUNCTION calculate_wardrobe_diversity(target_user_id UUID) 
RETURNS DECIMAL AS $$
DECLARE 
    diversity_score DECIMAL;
BEGIN
SELECT
    (
        COUNT(DISTINCT category_id) * 10 + 
        COUNT(DISTINCT primary_color) * 5 + 
        COUNT(DISTINCT subcategory_id) * 3 + 
        CASE
            WHEN array_length(array_agg(DISTINCT unnest_season), 1) > 1 THEN 20
            ELSE 0
        END
    ) :: DECIMAL / 100.0 INTO diversity_score
FROM
    public.clothing_items,
    LATERAL unnest(season_names) AS unnest_season
WHERE
    user_id = target_user_id
    AND is_archived = FALSE
    AND deleted_at IS NULL;

    RETURN LEAST(diversity_score, 1.0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Add indexes for new columns
CREATE INDEX idx_seasonal_trends_season_name ON public.seasonal_trends(season_name);
CREATE INDEX idx_outfit_recommendations_season_name ON public.outfit_recommendations(season_name);

-- Comments
COMMENT ON TABLE public.seasons IS 'Dynamic seasons table replacing season enum';
COMMENT ON TABLE public.fit_preferences IS 'Dynamic fit preferences table replacing fit_preference enum';

-- Migration: 20251202000003_fix_remaining_enums.sql

-- ============================================================================
-- FIX REMAINING CRITICAL ENUMS
-- Handle the most commonly used enums that could cause errors
-- ============================================================================

-- Update outfit_recommendations table (most critical)
ALTER TABLE public.outfit_recommendations 
ADD COLUMN occasion_name TEXT,
ADD COLUMN mood_name TEXT,
ADD COLUMN weather_condition_name TEXT,
ADD COLUMN activity_level_name TEXT;

-- Migrate existing data
UPDATE public.outfit_recommendations 
SET 
    occasion_name = occasion::text,
    mood_name = mood::text,
    weather_condition_name = weather_condition::text,
    activity_level_name = activity_level::text;

-- Drop old enum columns
ALTER TABLE public.outfit_recommendations 
DROP COLUMN occasion,
DROP COLUMN mood, 
DROP COLUMN weather_condition,
DROP COLUMN activity_level;

-- Update materialized view first to remove dependency
DROP MATERIALIZED VIEW IF EXISTS public.user_wardrobe_analytics;

-- Update user_interactions table
ALTER TABLE public.user_interactions 
ADD COLUMN interaction_type_name TEXT;

UPDATE public.user_interactions 
SET interaction_type_name = interaction_type::text;

ALTER TABLE public.user_interactions 
DROP COLUMN interaction_type;

-- Recreate materialized view with new column names
CREATE MATERIALIZED VIEW public.user_wardrobe_analytics AS
SELECT
    u.user_id,
    COUNT(DISTINCT ci.id) as total_items,
    COUNT(DISTINCT ci.category_id) as category_diversity,
    AVG(ci.sustainability_score) as avg_sustainability,
    SUM(ci.times_worn) as total_wears,
    COUNT(DISTINCT or_rec.id) as total_recommendations,
    COUNT(
        DISTINCT CASE
            WHEN ui.interaction_type_name = 'liked' THEN ui.id
        END
    ) as liked_recommendations,
    COUNT(
        DISTINCT CASE
            WHEN ui.interaction_type_name = 'worn' THEN ui.id
        END
    ) as worn_recommendations,
    ROUND(
        COUNT(
            DISTINCT CASE
                WHEN ui.interaction_type_name = 'liked' THEN ui.id
            END
        ) :: DECIMAL / NULLIF(COUNT(DISTINCT or_rec.id), 0) * 100,
        2
    ) as recommendation_acceptance_rate,
    MAX(ci.created_at) as last_item_added,
    MAX(or_rec.generated_at) as last_recommendation_generated
FROM
    public.user_profiles u
    LEFT JOIN public.clothing_items ci ON u.user_id = ci.user_id
    AND ci.is_archived = FALSE
    AND ci.deleted_at IS NULL
    LEFT JOIN public.outfit_recommendations or_rec ON u.user_id = or_rec.user_id
    LEFT JOIN public.user_interactions ui ON or_rec.id = ui.recommendation_id
GROUP BY
    u.user_id;

-- Recreate unique index
CREATE UNIQUE INDEX idx_user_analytics_user_id ON public.user_wardrobe_analytics(user_id);

-- Update user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN body_type_name TEXT DEFAULT 'prefer_not_to_say',
ADD COLUMN default_activity_level_name TEXT DEFAULT 'moderate';

UPDATE public.user_profiles 
SET 
    body_type_name = replace(body_type::text, '-', '_'),
    default_activity_level_name = replace(default_activity_level::text, '-', '_');

ALTER TABLE public.user_profiles 
DROP COLUMN body_type,
DROP COLUMN default_activity_level;

-- Update clothing_items weather_suitable array
ALTER TABLE public.clothing_items 
ADD COLUMN weather_suitable_names TEXT[] DEFAULT '{}';

UPDATE public.clothing_items 
SET weather_suitable_names = ARRAY(
    SELECT unnest(weather_suitable)::text
);

ALTER TABLE public.clothing_items 
DROP COLUMN weather_suitable;

-- Add indexes for new columns
CREATE INDEX idx_outfit_recommendations_occasion ON public.outfit_recommendations(occasion_name);
CREATE INDEX idx_outfit_recommendations_mood ON public.outfit_recommendations(mood_name);
CREATE INDEX idx_user_interactions_type ON public.user_interactions(interaction_type_name);
CREATE INDEX idx_clothing_weather_names ON public.clothing_items USING GIN(weather_suitable_names);

-- Normalize function to handle common input variations
CREATE OR REPLACE FUNCTION normalize_enum_value(input_value TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN lower(trim(replace(replace(input_value, '-', '_'), ' ', '_')));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Migration: 20251202000004_fix_user_profile_trigger.sql

-- Fix user profile trigger function with proper schema reference
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (user_id, created_at, updated_at)
    VALUES (NEW.id, NOW(), NOW());
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error and re-raise it
        RAISE LOG 'Error creating user profile for user %: %', NEW.id, SQLERRM;
        RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate the trigger to ensure it uses the updated function
DROP TRIGGER IF EXISTS create_user_profile_trigger ON auth.users;
CREATE TRIGGER create_user_profile_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- Migration: 20251202000005_create_supported_currencies.sql

-- This table is already created in migration 20251028094000_add_currency_support.sql
-- Skipping duplicate creation to avoid conflicts

-- Migration: 20251202000006_fix_user_signup_dependencies.sql

-- Fix user signup by ensuring all dependencies are properly handled
-- This migration ensures the user profile trigger works correctly

-- supported_currencies table already created in migration 20251028094000_add_currency_support.sql
-- Skipping duplicate creation

-- 3. Ensure user_profiles has currency fields (should be from 20251028095000)
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS preferred_currency TEXT DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS billing_currency TEXT DEFAULT 'USD';

-- 4. Temporarily disable currency validation triggers during user creation
DROP TRIGGER IF EXISTS validate_user_currencies ON public.user_profiles;

-- 5. Create a safer user profile creation function
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (
        user_id, 
        preferred_currency, 
        billing_currency,
        created_at, 
        updated_at
    )
    VALUES (
        NEW.id, 
        'USD', 
        'USD',
        NOW(), 
        NOW()
    );
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail the user creation
        RAISE LOG 'Error creating user profile for user %: %', NEW.id, SQLERRM;
        -- Still return NEW so user creation succeeds
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Recreate the trigger
DROP TRIGGER IF EXISTS create_user_profile_trigger ON auth.users;
CREATE TRIGGER create_user_profile_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- 7. Re-enable currency validation but make it more lenient
CREATE OR REPLACE FUNCTION validate_currency_code()
RETURNS TRIGGER AS $$
BEGIN
    -- Only validate if currency is not USD (default)
    IF NEW.preferred_currency IS NOT NULL 
       AND NEW.preferred_currency != 'USD' 
       AND NOT EXISTS (
        SELECT 1 FROM public.supported_currencies 
        WHERE code = NEW.preferred_currency AND is_active = TRUE
    ) THEN
        -- Don't fail, just log and use USD
        RAISE LOG 'Invalid preferred currency %, using USD instead', NEW.preferred_currency;
        NEW.preferred_currency := 'USD';
    END IF;
    
    IF NEW.billing_currency IS NOT NULL 
       AND NEW.billing_currency != 'USD'
       AND NOT EXISTS (
        SELECT 1 FROM public.supported_currencies 
        WHERE code = NEW.billing_currency AND is_active = TRUE
    ) THEN
        -- Don't fail, just log and use USD
        RAISE LOG 'Invalid billing currency %, using USD instead', NEW.billing_currency;
        NEW.billing_currency := 'USD';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Recreate the currency validation trigger (more lenient)
CREATE TRIGGER validate_user_currencies
    BEFORE INSERT OR UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION validate_currency_code();

-- 9. Ensure RLS is properly set up for user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;

-- Recreate policies
CREATE POLICY "Users can view own profile" ON public.user_profiles 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.user_profiles 
FOR UPDATE USING (auth.uid() = user_id);

COMMENT ON FUNCTION create_user_profile IS 'Creates user profile on signup with error handling';
COMMENT ON FUNCTION validate_currency_code IS 'Validates currency codes with fallback to USD';

-- Migration: 20251202000007_refresh_analytics_view.sql

-- The materialized view should already exist from migration 20251202000003_fix_remaining_enums.sql
-- Just refresh it to ensure it has current data
DO $$
BEGIN
    -- Check if the materialized view exists
    IF EXISTS (
        SELECT 1 FROM pg_matviews 
        WHERE schemaname = 'public' AND matviewname = 'user_wardrobe_analytics'
    ) THEN
        -- Refresh the existing view
        REFRESH MATERIALIZED VIEW user_wardrobe_analytics;
    END IF;
END $$;

-- Add a function to automatically refresh the view when needed
CREATE OR REPLACE FUNCTION refresh_user_analytics()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW user_wardrobe_analytics;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to refresh analytics when relevant data changes
DROP TRIGGER IF EXISTS refresh_analytics_on_clothing_items ON clothing_items;
CREATE TRIGGER refresh_analytics_on_clothing_items
  AFTER INSERT OR UPDATE OR DELETE ON clothing_items
  FOR EACH STATEMENT
  EXECUTE FUNCTION refresh_user_analytics();

DROP TRIGGER IF EXISTS refresh_analytics_on_recommendations ON outfit_recommendations;
CREATE TRIGGER refresh_analytics_on_recommendations
  AFTER INSERT OR UPDATE OR DELETE ON outfit_recommendations
  FOR EACH STATEMENT
  EXECUTE FUNCTION refresh_user_analytics();

DROP TRIGGER IF EXISTS refresh_analytics_on_interactions ON user_interactions;
CREATE TRIGGER refresh_analytics_on_interactions
  AFTER INSERT OR UPDATE OR DELETE ON user_interactions
  FOR EACH STATEMENT
  EXECUTE FUNCTION refresh_user_analytics();

-- Migration: 20251202000008_add_foreign_keys.sql

-- Add indexes for better query performance (no foreign keys to preserve flexibility)

-- Partial indexes for better performance on non-null values
CREATE INDEX IF NOT EXISTS idx_user_interactions_recommendation_id 
ON public.user_interactions(recommendation_id) WHERE recommendation_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_interactions_clothing_item_id 
ON public.user_interactions(clothing_item_id) WHERE clothing_item_id IS NOT NULL;

-- Composite index for user queries
CREATE INDEX IF NOT EXISTS idx_user_interactions_user_type 
ON public.user_interactions(user_id, interaction_type_name);

-- Keep original constraint (preserve existing behavior)
-- No changes to check_interaction_target constraint

-- Migration: 20251203000000_add_production_features.sql

-- ============================================================================
-- ADD PRODUCTION FEATURES FROM PREVIOUS SCHEMA
-- Mobile money, calendar events, enhanced referrals, sustainability, ratings
-- ============================================================================

-- 1. ENHANCE PAYMENTS TABLE FOR MOBILE MONEY SUPPORT
ALTER TABLE payments 
ADD COLUMN mobile_provider TEXT,
ADD COLUMN phone_number TEXT,
ADD COLUMN external_transaction_id TEXT;

-- Add index for mobile money lookups
CREATE INDEX idx_payments_external_transaction ON payments(external_transaction_id) WHERE external_transaction_id IS NOT NULL;
CREATE INDEX idx_payments_phone ON payments(phone_number) WHERE phone_number IS NOT NULL;

-- 2. ENHANCE USER INTERACTIONS WITH RATING SYSTEM
ALTER TABLE user_interactions 
ADD COLUMN IF NOT EXISTS rating INTEGER CHECK (rating >= 1 AND rating <= 5);

-- Add index for rating analytics
CREATE INDEX idx_user_interactions_rating ON user_interactions(rating) WHERE rating IS NOT NULL;

-- 3. ENHANCE REFERRALS TABLE
ALTER TABLE referrals 
ADD COLUMN referral_source TEXT DEFAULT 'direct',
ADD COLUMN conversion_data JSONB DEFAULT '{}';

-- Add index for referral analytics
CREATE INDEX idx_referrals_source ON referrals(referral_source);

-- 4. CREATE EVENT TEMPLATES TABLE
CREATE TABLE event_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    default_occasion TEXT, -- maps to existing occasion system
    is_favorite BOOLEAN DEFAULT FALSE,
    use_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CREATE EVENTS TABLE
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    template_id UUID REFERENCES event_templates(id),
    event_datetime TIMESTAMPTZ NOT NULL,
    location TEXT,
    notes TEXT,
    weather_at_creation JSONB,
    status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CREATE EVENT OUTFIT CHOICES TABLE
CREATE TABLE event_outfit_choices (
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    outfit_recommendation_id UUID, -- No FK due to partitioned table
    choice_type TEXT CHECK (choice_type IN ('considered', 'selected', 'worn', 'rejected')),
    feedback_note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (event_id, outfit_recommendation_id, choice_type)
);

-- 7. CREATE SUSTAINABILITY TRACKING TABLE
CREATE TABLE sustainability_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    metric_type TEXT NOT NULL CHECK (metric_type IN ('rewear', 'cost_per_wear', 'eco_score', 'carbon_footprint')),
    value DECIMAL(10,2) NOT NULL,
    related_item_id UUID, -- references clothing_items(id) but no FK for flexibility
    period_start DATE NOT NULL,
    period_end DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX idx_event_templates_user ON event_templates(user_id);
CREATE INDEX idx_event_templates_favorite ON event_templates(user_id, is_favorite) WHERE is_favorite = TRUE;
CREATE INDEX idx_event_templates_usage ON event_templates(user_id, use_count DESC);

CREATE INDEX idx_events_user_datetime ON events(user_id, event_datetime);
CREATE INDEX idx_events_template ON events(template_id) WHERE template_id IS NOT NULL;
CREATE INDEX idx_events_status ON events(user_id, status);

CREATE INDEX idx_event_choices_event ON event_outfit_choices(event_id);
CREATE INDEX idx_event_choices_outfit ON event_outfit_choices(outfit_recommendation_id);
CREATE INDEX idx_event_choices_type ON event_outfit_choices(choice_type);

CREATE INDEX idx_sustainability_user_type ON sustainability_tracking(user_id, metric_type);
CREATE INDEX idx_sustainability_period ON sustainability_tracking(period_start, period_end);
CREATE INDEX idx_sustainability_item ON sustainability_tracking(related_item_id) WHERE related_item_id IS NOT NULL;

-- ROW LEVEL SECURITY
ALTER TABLE event_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_outfit_choices ENABLE ROW LEVEL SECURITY;
ALTER TABLE sustainability_tracking ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES
CREATE POLICY "Users can manage own event templates" ON event_templates 
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own events" ON events 
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own event choices" ON event_outfit_choices 
FOR ALL USING (
    event_id IN (SELECT id FROM events WHERE user_id = auth.uid())
);

CREATE POLICY "Users can manage own sustainability data" ON sustainability_tracking 
FOR ALL USING (auth.uid() = user_id);

-- TRIGGERS FOR UPDATED_AT
CREATE TRIGGER update_event_templates_updated_at 
BEFORE UPDATE ON event_templates 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at 
BEFORE UPDATE ON events 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION increment_template_usage(template_uuid UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE event_templates 
    SET use_count = use_count + 1 
    WHERE id = template_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION get_user_sustainability_score(target_user_id UUID, metric_type_param TEXT)
RETURNS DECIMAL AS $$
DECLARE
    avg_score DECIMAL;
BEGIN
    SELECT AVG(value) INTO avg_score
    FROM sustainability_tracking
    WHERE user_id = target_user_id 
    AND metric_type = metric_type_param
    AND period_start >= CURRENT_DATE - INTERVAL '30 days';
    
    RETURN COALESCE(avg_score, 0);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '';

-- COMMENTS
COMMENT ON TABLE event_templates IS 'Reusable event patterns that users create (Work meeting, Date night, etc.)';
COMMENT ON TABLE events IS 'Specific event occurrences with outfit planning context';
COMMENT ON TABLE event_outfit_choices IS 'Tracks user outfit selections for ML learning';
COMMENT ON TABLE sustainability_tracking IS 'Tracks user sustainability metrics over time';
COMMENT ON COLUMN user_interactions.rating IS 'Optional 1-5 rating for granular feedback';
COMMENT ON COLUMN payments.mobile_provider IS 'Mobile money provider (M-Pesa, Airtel Money, etc.)';
COMMENT ON COLUMN referrals.referral_source IS 'Source of referral (social_media, word_of_mouth, etc.)';

