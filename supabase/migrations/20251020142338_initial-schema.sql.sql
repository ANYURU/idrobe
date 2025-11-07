-- ============================================================================
-- AI-Powered Clothing Recommendation App - PostgreSQL Schema for Supabase
-- Benchmark: Original generated schema with modifications highlighted
-- ============================================================================
-- Enable required extensions
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

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
    id UUID DEFAULT gen_random_uuid(),
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
    id UUID DEFAULT gen_random_uuid(),
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
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
CREATE
OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();

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
CREATE
OR REPLACE FUNCTION refresh_wardrobe_analytics() RETURNS void AS $$ BEGIN REFRESH MATERIALIZED VIEW CONCURRENTLY public.user_wardrobe_analytics;

END;

$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to find similar clothing items (vector similarity)
CREATE
OR REPLACE FUNCTION find_similar_items(
    target_embedding VECTOR(512),
    target_user_id UUID,
    similarity_threshold DECIMAL DEFAULT 0.7,
    limit_count INTEGER DEFAULT 10
) RETURNS TABLE(
    item_id UUID,
    name TEXT,
    category clothing_category,
    similarity_score DECIMAL
) AS $$ BEGIN RETURN QUERY
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
CREATE
OR REPLACE FUNCTION calculate_wardrobe_diversity(target_user_id UUID) RETURNS DECIMAL AS $$ DECLARE diversity_score DECIMAL;

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
        ARRAY ['dresses', 'tops'] :: clothing_category [],
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
        ARRAY ['swimwear', 'dresses'] :: clothing_category [],
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
        ARRAY ['outerwear', 'shoes'] :: clothing_category [],
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
        ARRAY ['outerwear', 'tops'] :: clothing_category [],
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