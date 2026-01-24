-- ============================================================================
-- COMPLETE CONSOLIDATED MIGRATION - IDrobe Database Schema
-- Combines all migrations into a single comprehensive schema setup
-- ============================================================================

BEGIN;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA extensions;

-- Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;
GRANT USAGE ON SCHEMA extensions TO authenticated;
GRANT USAGE ON SCHEMA extensions TO service_role;

-- ============================================================================
-- ENUM TYPES (for type safety and validation)
-- ============================================================================
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
    'prefer-not-to-say'
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
-- DYNAMIC CATEGORIES SYSTEM
-- ============================================================================

-- Core category reference table
CREATE TABLE public.clothing_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    parent_category_id UUID REFERENCES public.clothing_categories(id),
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    source TEXT DEFAULT 'manual',
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

-- Style tags reference table
CREATE TABLE public.style_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    popularity_score INTEGER DEFAULT 0,
    is_trending BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    source TEXT DEFAULT 'manual',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seasons reference table
CREATE TABLE public.seasons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fit preferences reference table
CREATE TABLE public.fit_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CURRENCY AND SUBSCRIPTION SYSTEM
-- ============================================================================

-- Supported currencies
CREATE TABLE public.supported_currencies (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    symbol TEXT,
    decimal_places INTEGER DEFAULT 2,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 999
);

-- Exchange rates
CREATE TABLE public.exchange_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    base_currency TEXT NOT NULL DEFAULT 'USD',
    target_currency TEXT NOT NULL,
    rate DECIMAL(12,6) NOT NULL,
    provider TEXT DEFAULT 'exchangerate-api',
    rate_date DATE DEFAULT CURRENT_DATE,
    fetched_at TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
    update_frequency TEXT DEFAULT 'daily',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscription plans
CREATE TABLE public.subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'USD',
    billing_interval TEXT NOT NULL CHECK (billing_interval IN ('month', 'year')),
    trial_days INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Plan limits
CREATE TABLE public.plan_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES public.subscription_plans(id) ON DELETE CASCADE,
    limit_type TEXT NOT NULL,
    limit_value INTEGER NOT NULL,
    period TEXT NOT NULL DEFAULT 'total',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User subscriptions
CREATE TABLE public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'unpaid')),
    stripe_subscription_id TEXT UNIQUE,
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    trial_end_date TIMESTAMPTZ,
    billing_currency TEXT NOT NULL DEFAULT 'USD',
    grandfathered BOOLEAN DEFAULT FALSE,
    canceled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment tracking
CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID REFERENCES public.subscriptions(id),
    user_id UUID NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
    payment_type TEXT NOT NULL DEFAULT 'subscription' CHECK (payment_type IN ('subscription', 'credit', 'refund')),
    stripe_payment_intent_id TEXT,
    stripe_invoice_id TEXT,
    paid_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    failure_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Referral system
CREATE TABLE public.referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL,
    referee_id UUID NOT NULL,
    referral_code TEXT NOT NULL UNIQUE,
    reward_type TEXT NOT NULL DEFAULT 'credit' CHECK (reward_type IN ('credit', 'cash', 'discount')),
    reward_value DECIMAL(10,2) NOT NULL,
    reward_currency TEXT NOT NULL DEFAULT 'USD',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'paid', 'expired')),
    completed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    source TEXT DEFAULT 'manual',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User credits
CREATE TABLE public.user_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    credit_type TEXT NOT NULL CHECK (credit_type IN ('referral', 'promo', 'refund', 'bonus')),
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    source_id UUID,
    description TEXT,
    expires_at TIMESTAMPTZ,
    used_at TIMESTAMPTZ,
    used_for_payment_id UUID REFERENCES public.payments(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage tracking
CREATE TABLE public.usage_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    usage_type TEXT NOT NULL,
    usage_count INTEGER DEFAULT 1,
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- USER PROFILE TABLE
-- ============================================================================
CREATE TABLE public.user_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    body_type body_type DEFAULT 'prefer-not-to-say',
    height_cm INTEGER CHECK (height_cm > 0 AND height_cm < 300),
    weight_kg DECIMAL(5, 2) CHECK (weight_kg > 0),
    preferred_fit fit_preference DEFAULT 'regular',
    style_preferences TEXT[],
    color_preferences TEXT[],
    sustainability_score INTEGER DEFAULT 50 CHECK (sustainability_score >= 0 AND sustainability_score <= 100),
    location_city TEXT,
    location_country TEXT,
    timezone TEXT DEFAULT 'UTC',
    cultural_preferences JSONB DEFAULT '{}',
    default_activity_level activity_level DEFAULT 'moderate',
    profile_image_url TEXT,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    preferred_currency TEXT DEFAULT 'USD',
    billing_currency TEXT DEFAULT 'USD',
    current_plan_id UUID REFERENCES public.subscription_plans(id),
    subscription_status TEXT DEFAULT 'free' CHECK (subscription_status IN ('free', 'trialing', 'active', 'past_due', 'canceled')),
    plan_expires_at TIMESTAMPTZ,
    monthly_uploads_used INTEGER DEFAULT 0,
    monthly_recs_used INTEGER DEFAULT 0,
    monthly_tryons_used INTEGER DEFAULT 0,
    usage_reset_date TIMESTAMPTZ DEFAULT date_trunc('month', NOW()),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CLOTHING ITEMS TABLE
-- ============================================================================
CREATE TABLE public.clothing_items (
    id UUID DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category_id UUID REFERENCES public.clothing_categories(id),
    subcategory_id UUID REFERENCES public.clothing_subcategories(id),
    brand TEXT,
    size TEXT,
    primary_color TEXT NOT NULL,
    secondary_colors TEXT[],
    material TEXT[],
    pattern TEXT,
    fit fit_preference DEFAULT 'regular',
    season_ids UUID[],
    weather_suitable weather_condition[] DEFAULT '{}',
    care_instructions TEXT,
    purchase_date DATE,
    cost DECIMAL(10,2),
    currency TEXT DEFAULT 'USD',
    times_worn INTEGER DEFAULT 0,
    last_worn_date DATE,
    sustainability_score DECIMAL(3,2) CHECK (sustainability_score >= 0 AND sustainability_score <= 100),
    is_eco_friendly BOOLEAN DEFAULT FALSE,
    ai_confidence_score DECIMAL(3, 2) CHECK (ai_confidence_score >= 0 AND ai_confidence_score <= 1),
    embedding VECTOR(768),
    ai_metadata JSONB DEFAULT '{}',
    image_url TEXT NOT NULL,
    thumbnail_url TEXT,
    is_favorite BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    notes TEXT,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (id, user_id)
) PARTITION BY HASH (user_id);

-- Create partitions
CREATE TABLE public.clothing_items_p0 PARTITION OF public.clothing_items 
FOR VALUES WITH (MODULUS 2, REMAINDER 0);

CREATE TABLE public.clothing_items_p1 PARTITION OF public.clothing_items 
FOR VALUES WITH (MODULUS 2, REMAINDER 1);

-- Junction table for style tags
CREATE TABLE public.clothing_item_style_tags (
    clothing_item_id UUID,
    style_tag_id UUID REFERENCES public.style_tags(id),
    PRIMARY KEY (clothing_item_id, style_tag_id)
);

-- ============================================================================
-- OUTFIT RECOMMENDATIONS TABLE
-- ============================================================================
CREATE TABLE public.outfit_recommendations (
    id UUID DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    occasion occasion NOT NULL,
    mood mood,
    weather_condition weather_condition,
    temperature_celsius INTEGER,
    activity_level activity_level,
    destination TEXT,
    time_of_day TEXT,
    event_duration_hours INTEGER,
    season season,
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

-- Create partitions
CREATE TABLE public.outfit_recommendations_p0 PARTITION OF public.outfit_recommendations 
FOR VALUES WITH (MODULUS 2, REMAINDER 0);

CREATE TABLE public.outfit_recommendations_p1 PARTITION OF public.outfit_recommendations 
FOR VALUES WITH (MODULUS 2, REMAINDER 1);

-- ============================================================================
-- ADDITIONAL CORE TABLES
-- ============================================================================

-- User interactions
CREATE TABLE public.user_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recommendation_id UUID,
    clothing_item_id UUID,
    interaction_type_name TEXT NOT NULL,
    feedback_text TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    interacted_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT check_interaction_target CHECK (
        (recommendation_id IS NOT NULL AND clothing_item_id IS NULL) OR
        (recommendation_id IS NULL AND clothing_item_id IS NOT NULL)
    )
);

-- Wardrobe gaps
CREATE TABLE public.wardrobe_gaps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gap_type TEXT NOT NULL,
    category_id UUID REFERENCES public.clothing_categories(id),
    subcategory_id UUID REFERENCES public.clothing_subcategories(id),
    description TEXT NOT NULL,
    priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
    suggested_items JSONB DEFAULT '[]',
    estimated_cost DECIMAL(10,2),
    currency TEXT DEFAULT 'USD',
    is_addressed BOOLEAN DEFAULT FALSE,
    addressed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Outfit collections
CREATE TABLE public.outfit_collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    clothing_item_ids UUID[] NOT NULL,
    is_favorite BOOLEAN DEFAULT FALSE,
    times_worn INTEGER DEFAULT 0,
    last_worn_date DATE,
    is_public BOOLEAN DEFAULT FALSE,
    share_count INTEGER DEFAULT 0,
    estimated_cost DECIMAL(10,2),
    currency TEXT DEFAULT 'USD',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seasonal trends
CREATE TABLE public.seasonal_trends (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    season season NOT NULL,
    year INTEGER NOT NULL,
    trending_colors TEXT[],
    trending_patterns TEXT[],
    trending_styles TEXT[],
    trending_category_ids UUID[],
    trend_description TEXT,
    source TEXT,
    confidence_score DECIMAL(3, 2),
    region TEXT,
    valid_from DATE NOT NULL,
    valid_until DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(season, year, region)
);

-- Junction table for seasonal trends categories
CREATE TABLE public.seasonal_trend_categories (
    trend_id UUID REFERENCES public.seasonal_trends(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.clothing_categories(id) ON DELETE CASCADE,
    PRIMARY KEY (trend_id, category_id)
);

-- Clothing duplicates
CREATE TABLE public.clothing_duplicates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    original_item_id UUID NOT NULL,
    duplicate_item_id UUID NOT NULL,
    similarity_score DECIMAL(3, 2) NOT NULL CHECK (similarity_score >= 0 AND similarity_score <= 1),
    detection_method TEXT DEFAULT 'embedding-similarity',
    user_confirmed BOOLEAN,
    resolved_at TIMESTAMPTZ,
    detected_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(original_item_id, duplicate_item_id)
);

-- Recommendation logs
CREATE TABLE public.recommendation_logs (
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recommendation_id UUID,
    input_context JSONB NOT NULL,
    output_items UUID[],
    ai_confidence DECIMAL(3, 2) CHECK (ai_confidence >= 0 AND ai_confidence <= 1),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Error logs
CREATE TABLE public.error_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    error_type TEXT NOT NULL,
    error_message TEXT NOT NULL,
    context JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Category creation log
CREATE TABLE public.category_creation_log (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    category_name TEXT NOT NULL
);

-- Waitlist archive
CREATE TABLE public.waitlist_archive (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'pending',
    referred_by UUID,
    migrated_to_referral_id UUID,
    migrated_at TIMESTAMPTZ
);

-- Event system tables
CREATE TABLE public.event_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    occasion occasion NOT NULL,
    default_duration_hours INTEGER,
    style_preferences TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    occasion occasion NOT NULL,
    event_date TIMESTAMPTZ NOT NULL,
    duration_hours INTEGER,
    location TEXT,
    weather_forecast JSONB,
    outfit_selected_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.event_outfit_choices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    outfit_items UUID[] NOT NULL,
    user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
    is_selected BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sustainability tracking
CREATE TABLE public.sustainability_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    item_id UUID,
    action_type TEXT NOT NULL,
    impact_score DECIMAL(5,2),
    carbon_footprint_kg DECIMAL(8,3),
    water_usage_liters DECIMAL(10,2),
    waste_reduction_kg DECIMAL(8,3),
    action_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMIT;