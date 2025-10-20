-- ============================================================================
-- CONSOLIDATED MIGRATION - Fix All Issues and Follow Best Practices
-- Addresses fragmentation, enum conflicts, and missing features
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. EXTENSIONS AND SCHEMA SETUP
-- ============================================================================

-- Ensure extensions exist in proper schema
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch WITH SCHEMA extensions;

-- Grant proper permissions on extensions schema
GRANT USAGE ON SCHEMA extensions TO authenticated;
GRANT USAGE ON SCHEMA extensions TO service_role;

-- ============================================================================
-- 2. CLEAN UP PROBLEMATIC ENUM TYPES
-- ============================================================================

-- Drop problematic enum types that cause migration conflicts
DROP TYPE IF EXISTS clothing_category CASCADE;
DROP TYPE IF EXISTS clothing_subcategory CASCADE;
DROP TYPE IF EXISTS season CASCADE;
DROP TYPE IF EXISTS occasion CASCADE;
DROP TYPE IF EXISTS mood CASCADE;
DROP TYPE IF EXISTS activity_level CASCADE;
DROP TYPE IF EXISTS body_type CASCADE;
DROP TYPE IF EXISTS weather_condition CASCADE;
DROP TYPE IF EXISTS interaction_type CASCADE;
DROP TYPE IF EXISTS fit_preference CASCADE;

-- ============================================================================
-- 3. ENSURE CORE TABLES EXIST WITH PROPER STRUCTURE
-- ============================================================================

-- Clothing categories (ensure exists with proper structure)
CREATE TABLE IF NOT EXISTS public.clothing_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    parent_category_id UUID REFERENCES public.clothing_categories(id),
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    source TEXT DEFAULT 'manual',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clothing subcategories
CREATE TABLE IF NOT EXISTS public.clothing_subcategories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category_id UUID NOT NULL REFERENCES public.clothing_categories(id),
    is_active BOOLEAN DEFAULT TRUE,
    source TEXT DEFAULT 'manual',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(name, category_id)
);

-- Style tags
CREATE TABLE IF NOT EXISTS public.style_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    popularity_score INTEGER DEFAULT 0,
    is_trending BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    source TEXT DEFAULT 'manual',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seasons reference table
CREATE TABLE IF NOT EXISTS public.seasons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fit preferences reference table
CREATE TABLE IF NOT EXISTS public.fit_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 4. SUBSCRIPTION AND CURRENCY SYSTEM (MISSING FROM SUPABASE)
-- ============================================================================

-- Supported currencies
CREATE TABLE IF NOT EXISTS public.supported_currencies (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    symbol TEXT,
    decimal_places INTEGER DEFAULT 2,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 999
);

-- Exchange rates
CREATE TABLE IF NOT EXISTS public.exchange_rates (
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
CREATE TABLE IF NOT EXISTS public.subscription_plans (
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
CREATE TABLE IF NOT EXISTS public.plan_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES public.subscription_plans(id) ON DELETE CASCADE,
    limit_type TEXT NOT NULL,
    limit_value INTEGER NOT NULL,
    period TEXT NOT NULL DEFAULT 'total',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
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

-- ============================================================================
-- 5. UPDATE USER_PROFILES WITH MISSING COLUMNS
-- ============================================================================

-- Add missing columns to user_profiles
DO $$
BEGIN
    -- Add subscription-related columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'current_plan_id') THEN
        ALTER TABLE public.user_profiles ADD COLUMN current_plan_id UUID REFERENCES public.subscription_plans(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'subscription_status') THEN
        ALTER TABLE public.user_profiles ADD COLUMN subscription_status TEXT DEFAULT 'free' CHECK (subscription_status IN ('free', 'trialing', 'active', 'past_due', 'canceled'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'plan_expires_at') THEN
        ALTER TABLE public.user_profiles ADD COLUMN plan_expires_at TIMESTAMPTZ;
    END IF;
    
    -- Add usage tracking columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'monthly_uploads_used') THEN
        ALTER TABLE public.user_profiles ADD COLUMN monthly_uploads_used INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'monthly_recs_used') THEN
        ALTER TABLE public.user_profiles ADD COLUMN monthly_recs_used INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'usage_reset_date') THEN
        ALTER TABLE public.user_profiles ADD COLUMN usage_reset_date TIMESTAMPTZ DEFAULT date_trunc('month', NOW());
    END IF;
    
    -- Add currency columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'preferred_currency') THEN
        ALTER TABLE public.user_profiles ADD COLUMN preferred_currency TEXT DEFAULT 'USD';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'billing_currency') THEN
        ALTER TABLE public.user_profiles ADD COLUMN billing_currency TEXT DEFAULT 'USD';
    END IF;
END $$;

-- ============================================================================
-- 6. UPDATE CLOTHING_ITEMS WITH PROPER STRUCTURE
-- ============================================================================

-- Ensure clothing_items has all required columns
DO $$
BEGIN
    -- Add foreign key columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clothing_items' AND column_name = 'category_id') THEN
        ALTER TABLE public.clothing_items ADD COLUMN category_id UUID REFERENCES public.clothing_categories(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clothing_items' AND column_name = 'subcategory_id') THEN
        ALTER TABLE public.clothing_items ADD COLUMN subcategory_id UUID REFERENCES public.clothing_subcategories(id);
    END IF;
    
    -- Add text-based columns to replace enums
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clothing_items' AND column_name = 'season_names') THEN
        ALTER TABLE public.clothing_items ADD COLUMN season_names TEXT[] DEFAULT '{}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clothing_items' AND column_name = 'fit_name') THEN
        ALTER TABLE public.clothing_items ADD COLUMN fit_name TEXT DEFAULT 'regular';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clothing_items' AND column_name = 'weather_suitable_names') THEN
        ALTER TABLE public.clothing_items ADD COLUMN weather_suitable_names TEXT[] DEFAULT '{}';
    END IF;
    
    -- Add currency column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clothing_items' AND column_name = 'currency') THEN
        ALTER TABLE public.clothing_items ADD COLUMN currency TEXT DEFAULT 'USD';
    END IF;
    
    -- Add sustainability score with proper type
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clothing_items' AND column_name = 'sustainability_score') THEN
        ALTER TABLE public.clothing_items ADD COLUMN sustainability_score DECIMAL(3,2) CHECK (sustainability_score >= 0 AND sustainability_score <= 100);
    END IF;
END $$;

-- ============================================================================
-- 7. CREATE JUNCTION TABLES
-- ============================================================================

-- Style tags junction table
CREATE TABLE IF NOT EXISTS public.clothing_item_style_tags (
    clothing_item_id UUID,
    style_tag_id UUID REFERENCES public.style_tags(id),
    PRIMARY KEY (clothing_item_id, style_tag_id)
);

-- ============================================================================
-- 8. CREATE ESSENTIAL FUNCTIONS WITH PROPER ERROR HANDLING
-- ============================================================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column() 
RETURNS TRIGGER 
SET search_path = ''
AS $$
BEGIN 
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create user profile function
CREATE OR REPLACE FUNCTION public.create_user_profile()
RETURNS TRIGGER
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.user_profiles (user_id, created_at, updated_at)
    VALUES (NEW.id, NOW(), NOW());
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error creating user profile for user %: %', NEW.id, SQLERRM;
        RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Find or create category function (improved)
CREATE OR REPLACE FUNCTION public.find_or_create_category(category_name TEXT)
RETURNS UUID
SET search_path = ''
AS $$
DECLARE
    category_id UUID;
    clean_name TEXT;
    is_common_category BOOLEAN := FALSE;
    common_categories TEXT[] := ARRAY[
        'tops', 'bottoms', 'dresses', 'outerwear', 'shoes', 
        'accessories', 'activewear', 'formalwear', 'underwear', 
        'sleepwear', 'bags', 'jewelry', 'hats', 'scarves', 
        'belts', 'eyewear', 'watches', 'swimwear', 'casualwear'
    ];
BEGIN
    IF category_name IS NULL OR trim(category_name) = '' THEN
        RAISE EXCEPTION 'Category name cannot be null or empty';
    END IF;
    
    IF length(trim(category_name)) > 100 THEN
        RAISE EXCEPTION 'Category name too long (max 100 characters)';
    END IF;
    
    clean_name := lower(trim(regexp_replace(category_name, '[^a-zA-Z0-9\\s\\-]', '', 'g')));
    is_common_category := clean_name = ANY(common_categories);
    
    SELECT id INTO category_id 
    FROM public.clothing_categories 
    WHERE lower(name) = clean_name;
    
    IF category_id IS NOT NULL AND is_common_category THEN
        UPDATE public.clothing_categories 
        SET is_active = TRUE 
        WHERE id = category_id AND NOT is_active;
    END IF;
    
    IF category_id IS NULL THEN
        INSERT INTO public.clothing_categories (name, is_active, source)
        VALUES (clean_name, is_common_category, CASE WHEN is_common_category THEN 'system' ELSE 'ai_suggested' END)
        RETURNING id INTO category_id;
    END IF;
    
    RETURN category_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Find or create subcategory function (improved)
CREATE OR REPLACE FUNCTION public.find_or_create_subcategory(subcategory_name TEXT, parent_category_id UUID)
RETURNS UUID
SET search_path = ''
AS $$
DECLARE
    subcategory_id UUID;
    clean_name TEXT;
    is_common_subcategory BOOLEAN := FALSE;
    common_subcategories TEXT[] := ARRAY[
        't-shirt', 'shirt', 'blouse', 'tank-top', 'sweater', 'hoodie', 'cardigan', 'polo',
        'jeans', 'trousers', 'shorts', 'skirt', 'leggings', 'joggers', 'chinos',
        'sneakers', 'boots', 'sandals', 'heels', 'flats', 'loafers', 'oxfords', 'slippers',
        'jacket', 'coat', 'blazer', 'vest', 'windbreaker', 'parka',
        'dress', 'gown', 'sundress', 'maxi-dress', 'mini-dress'
    ];
BEGIN
    IF subcategory_name IS NULL OR trim(subcategory_name) = '' THEN
        RETURN NULL;
    END IF;
    
    clean_name := lower(trim(regexp_replace(subcategory_name, '[^a-zA-Z0-9\\s\\-]', '', 'g')));
    is_common_subcategory := clean_name = ANY(common_subcategories);
    
    SELECT id INTO subcategory_id 
    FROM public.clothing_subcategories 
    WHERE lower(name) = clean_name 
    AND category_id = parent_category_id;
    
    IF subcategory_id IS NOT NULL AND is_common_subcategory THEN
        UPDATE public.clothing_subcategories 
        SET is_active = TRUE 
        WHERE id = subcategory_id AND NOT is_active;
    END IF;
    
    IF subcategory_id IS NULL THEN
        INSERT INTO public.clothing_subcategories (name, category_id, is_active, source)
        VALUES (clean_name, parent_category_id, is_common_subcategory, CASE WHEN is_common_subcategory THEN 'system' ELSE 'ai_suggested' END)
        RETURNING id INTO subcategory_id;
    END IF;
    
    RETURN subcategory_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Currency validation function
CREATE OR REPLACE FUNCTION public.validate_currency_code()
RETURNS TRIGGER
SET search_path = ''
AS $$
BEGIN
    IF NEW.preferred_currency IS NOT NULL 
       AND NEW.preferred_currency != 'USD' 
       AND NOT EXISTS (
        SELECT 1 FROM public.supported_currencies 
        WHERE code = NEW.preferred_currency AND is_active = TRUE
    ) THEN
        RAISE LOG 'Invalid preferred currency %, using USD instead', NEW.preferred_currency;
        NEW.preferred_currency := 'USD';
    END IF;
    
    IF NEW.billing_currency IS NOT NULL 
       AND NEW.billing_currency != 'USD'
       AND NOT EXISTS (
        SELECT 1 FROM public.supported_currencies 
        WHERE code = NEW.billing_currency AND is_active = TRUE
    ) THEN
        RAISE LOG 'Invalid billing currency %, using USD instead', NEW.billing_currency;
        NEW.billing_currency := 'USD';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 9. CREATE ESSENTIAL INDEXES
-- ============================================================================

-- Core indexes for performance
CREATE INDEX IF NOT EXISTS idx_clothing_user_id ON public.clothing_items(user_id);
CREATE INDEX IF NOT EXISTS idx_clothing_category_id ON public.clothing_items(category_id);
CREATE INDEX IF NOT EXISTS idx_clothing_subcategory_id ON public.clothing_items(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_clothing_season_names ON public.clothing_items USING GIN(season_names);
CREATE INDEX IF NOT EXISTS idx_clothing_weather_names ON public.clothing_items USING GIN(weather_suitable_names);
CREATE INDEX IF NOT EXISTS idx_clothing_items_user_active ON public.clothing_items(user_id, is_archived, deleted_at);

-- Vector similarity search (if embedding column exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clothing_items' AND column_name = 'embedding') THEN
        CREATE INDEX IF NOT EXISTS idx_clothing_embedding ON public.clothing_items USING ivfflat(embedding vector_cosine_ops) WITH (lists = 100);
    END IF;
END $$;

-- Category system indexes
CREATE INDEX IF NOT EXISTS idx_categories_active ON public.clothing_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON public.clothing_categories(parent_category_id);
CREATE INDEX IF NOT EXISTS idx_subcategories_category ON public.clothing_subcategories(category_id);
CREATE INDEX IF NOT EXISTS idx_subcategories_active ON public.clothing_subcategories(is_active);
CREATE INDEX IF NOT EXISTS idx_style_tags_popularity_active ON public.style_tags(popularity_score DESC, is_active);

-- Junction table indexes
CREATE INDEX IF NOT EXISTS idx_style_tags_junction_item ON public.clothing_item_style_tags(clothing_item_id);
CREATE INDEX IF NOT EXISTS idx_style_tags_junction_tag ON public.clothing_item_style_tags(style_tag_id);

-- User profile indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_currency ON public.user_profiles(preferred_currency);
CREATE INDEX IF NOT EXISTS idx_user_profiles_plan ON public.user_profiles(current_plan_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_usage_reset ON public.user_profiles(usage_reset_date);

-- ============================================================================
-- 10. ENABLE ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all user-specific tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clothing_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clothing_item_style_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Enable RLS on reference tables
ALTER TABLE public.clothing_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clothing_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.style_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supported_currencies ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 11. CREATE RLS POLICIES
-- ============================================================================

-- User Profiles Policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Users can view own profile') THEN
        CREATE POLICY "Users can view own profile" ON public.user_profiles 
        FOR SELECT USING ((select auth.uid()) = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Users can insert own profile') THEN
        CREATE POLICY "Users can insert own profile" ON public.user_profiles 
        FOR INSERT WITH CHECK ((select auth.uid()) = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Users can update own profile') THEN
        CREATE POLICY "Users can update own profile" ON public.user_profiles 
        FOR UPDATE USING ((select auth.uid()) = user_id);
    END IF;
END $$;

-- Clothing Items Policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'clothing_items' AND policyname = 'Users can view own clothing items') THEN
        CREATE POLICY "Users can view own clothing items" ON public.clothing_items 
        FOR SELECT USING ((select auth.uid()) = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'clothing_items' AND policyname = 'Users can insert own clothing items') THEN
        CREATE POLICY "Users can insert own clothing items" ON public.clothing_items 
        FOR INSERT WITH CHECK ((select auth.uid()) = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'clothing_items' AND policyname = 'Users can update own clothing items') THEN
        CREATE POLICY "Users can update own clothing items" ON public.clothing_items 
        FOR UPDATE USING ((select auth.uid()) = user_id);
    END IF;
END $$;

-- Reference Tables Policies (Public Read Access)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'clothing_categories' AND policyname = 'Anyone can view active categories') THEN
        CREATE POLICY "Anyone can view active categories" ON public.clothing_categories 
        FOR SELECT USING (is_active = TRUE);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'clothing_subcategories' AND policyname = 'Anyone can view active subcategories') THEN
        CREATE POLICY "Anyone can view active subcategories" ON public.clothing_subcategories 
        FOR SELECT USING (is_active = TRUE);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'style_tags' AND policyname = 'Anyone can view active style tags') THEN
        CREATE POLICY "Anyone can view active style tags" ON public.style_tags 
        FOR SELECT USING (is_active = TRUE);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subscription_plans' AND policyname = 'Anyone can view active subscription plans') THEN
        CREATE POLICY "Anyone can view active subscription plans" ON public.subscription_plans 
        FOR SELECT USING (is_active = TRUE);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'supported_currencies' AND policyname = 'Anyone can view supported currencies') THEN
        CREATE POLICY "Anyone can view supported currencies" ON public.supported_currencies 
        FOR SELECT USING (is_active = TRUE);
    END IF;
END $$;

-- ============================================================================
-- 12. CREATE TRIGGERS
-- ============================================================================

-- Update timestamp triggers
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_profiles_updated_at') THEN
        CREATE TRIGGER update_user_profiles_updated_at 
        BEFORE UPDATE ON public.user_profiles 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_clothing_items_updated_at') THEN
        CREATE TRIGGER update_clothing_items_updated_at 
        BEFORE UPDATE ON public.clothing_items 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_categories_updated_at') THEN
        CREATE TRIGGER update_categories_updated_at 
        BEFORE UPDATE ON public.clothing_categories 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Currency validation trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'validate_user_currencies') THEN
        CREATE TRIGGER validate_user_currencies
        BEFORE INSERT OR UPDATE ON public.user_profiles
        FOR EACH ROW EXECUTE FUNCTION validate_currency_code();
    END IF;
END $$;

-- ============================================================================
-- 13. SEED ESSENTIAL DATA (SKIPPED - DATA ALREADY EXISTS)
-- ============================================================================

-- Categories already exist from previous migrations

-- Data seeding skipped - already exists from previous migrations

COMMIT;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.clothing_categories IS 'Dynamic clothing categories that can grow with fashion trends';
COMMENT ON TABLE public.clothing_subcategories IS 'Subcategories linked to main categories';
COMMENT ON TABLE public.style_tags IS 'Dynamic style tags for trend tracking';
COMMENT ON TABLE public.seasons IS 'Season reference table replacing enum';
COMMENT ON TABLE public.fit_preferences IS 'Fit preference reference table replacing enum';
COMMENT ON TABLE public.subscription_plans IS 'Available subscription plans for users';
COMMENT ON TABLE public.supported_currencies IS 'Currencies supported by the platform';
COMMENT ON FUNCTION public.find_or_create_category(TEXT) IS 'Creates categories with common types active by default';
COMMENT ON FUNCTION public.find_or_create_subcategory(TEXT, UUID) IS 'Creates subcategories with common types active by default';