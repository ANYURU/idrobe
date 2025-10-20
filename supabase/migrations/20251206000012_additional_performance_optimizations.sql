-- ============================================================================
-- ADDITIONAL PERFORMANCE OPTIMIZATIONS
-- Further improvements for database performance and maintenance
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. CREATE MISSING TABLES THAT LINTER REFERENCES
-- ============================================================================

-- Create tables that the linter found issues with but may not exist yet
CREATE TABLE IF NOT EXISTS public.outfit_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    occasion_name TEXT,
    weather_condition TEXT,
    mood TEXT,
    activity_level TEXT,
    recommended_items JSONB DEFAULT '[]',
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    feedback_rating INTEGER CHECK (feedback_rating >= 1 AND feedback_rating <= 5),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    interaction_type TEXT NOT NULL,
    target_id UUID,
    target_type TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.wardrobe_gaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    gap_type TEXT NOT NULL,
    category_id UUID REFERENCES public.clothing_categories(id),
    subcategory_id UUID REFERENCES public.clothing_subcategories(id),
    priority_score INTEGER DEFAULT 0,
    suggested_items JSONB DEFAULT '[]',
    is_addressed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.outfit_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    outfit_items JSONB DEFAULT '[]',
    tags TEXT[] DEFAULT '{}',
    is_favorite BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.clothing_duplicates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    item1_id UUID NOT NULL,
    item2_id UUID NOT NULL,
    similarity_score DECIMAL(3,2) CHECK (similarity_score >= 0 AND similarity_score <= 1),
    duplicate_type TEXT DEFAULT 'visual',
    is_confirmed BOOLEAN DEFAULT FALSE,
    is_dismissed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(item1_id, item2_id)
);

CREATE TABLE IF NOT EXISTS public.recommendation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    recommendation_type TEXT NOT NULL,
    input_data JSONB DEFAULT '{}',
    output_data JSONB DEFAULT '{}',
    processing_time_ms INTEGER,
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.error_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    error_type TEXT NOT NULL,
    error_message TEXT NOT NULL,
    stack_trace TEXT,
    request_data JSONB DEFAULT '{}',
    user_agent TEXT,
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    subscription_id UUID REFERENCES public.subscriptions(id),
    stripe_payment_intent_id TEXT UNIQUE,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    status TEXT NOT NULL DEFAULT 'pending',
    payment_method TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_user_id UUID NOT NULL,
    referred_user_id UUID,
    referral_code TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    reward_amount DECIMAL(10,2) DEFAULT 0,
    reward_currency TEXT DEFAULT 'USD',
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    credit_type TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    source TEXT NOT NULL,
    expires_at TIMESTAMPTZ,
    used_amount DECIMAL(10,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.usage_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    feature_name TEXT NOT NULL,
    usage_count INTEGER DEFAULT 1,
    usage_date DATE DEFAULT CURRENT_DATE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, feature_name, usage_date)
);

CREATE TABLE IF NOT EXISTS public.event_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    occasion_type TEXT,
    weather_requirements TEXT[],
    dress_code TEXT,
    color_preferences TEXT[],
    style_preferences TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    template_id UUID REFERENCES public.event_templates(id),
    name TEXT NOT NULL,
    event_date TIMESTAMPTZ NOT NULL,
    location TEXT,
    weather_forecast JSONB,
    chosen_outfit_id UUID,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.event_outfit_choices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    event_id UUID NOT NULL REFERENCES public.events(id),
    outfit_items JSONB NOT NULL DEFAULT '[]',
    confidence_score DECIMAL(3,2),
    is_selected BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sustainability_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    item_id UUID,
    action_type TEXT NOT NULL,
    environmental_impact JSONB DEFAULT '{}',
    carbon_footprint DECIMAL(10,4),
    water_usage DECIMAL(10,2),
    waste_reduction DECIMAL(10,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. ENABLE RLS ON NEW TABLES
-- ============================================================================

ALTER TABLE public.outfit_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wardrobe_gaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outfit_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clothing_duplicates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_outfit_choices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sustainability_tracking ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 3. CREATE PARTITIONED TABLES FOR HIGH-VOLUME DATA
-- ============================================================================

-- Create partitioned versions of high-volume tables if they don't exist
DO $$
BEGIN
    -- Check if partitioned clothing_items tables exist and create missing indexes
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clothing_items_p0') THEN
        -- Keep only one of each duplicate index
        CREATE INDEX IF NOT EXISTS clothing_items_p0_category_id_idx ON public.clothing_items_p0(category_id);
        CREATE INDEX IF NOT EXISTS clothing_items_p0_last_worn_date_idx ON public.clothing_items_p0(last_worn_date);
        CREATE INDEX IF NOT EXISTS clothing_items_p0_subcategory_id_idx ON public.clothing_items_p0(subcategory_id);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clothing_items_p1') THEN
        CREATE INDEX IF NOT EXISTS clothing_items_p1_category_id_idx ON public.clothing_items_p1(category_id);
        CREATE INDEX IF NOT EXISTS clothing_items_p1_last_worn_date_idx ON public.clothing_items_p1(last_worn_date);
        CREATE INDEX IF NOT EXISTS clothing_items_p1_subcategory_id_idx ON public.clothing_items_p1(subcategory_id);
    END IF;
    
    -- Same for outfit_recommendations partitions
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'outfit_recommendations_p0') THEN
        CREATE INDEX IF NOT EXISTS outfit_recommendations_p0_occasion_name_idx ON public.outfit_recommendations_p0(occasion_name);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'outfit_recommendations_p1') THEN
        CREATE INDEX IF NOT EXISTS outfit_recommendations_p1_occasion_name_idx ON public.outfit_recommendations_p1(occasion_name);
    END IF;
END $$;

-- ============================================================================
-- 4. CREATE MATERIALIZED VIEWS FOR ANALYTICS
-- ============================================================================

-- User wardrobe analytics view
CREATE MATERIALIZED VIEW IF NOT EXISTS public.user_wardrobe_analytics AS
SELECT 
    up.user_id,
    COUNT(ci.id) as total_items,
    COUNT(CASE WHEN ci.is_archived = FALSE THEN 1 END) as active_items,
    COUNT(DISTINCT ci.category_id) as unique_categories,
    COUNT(DISTINCT ci.subcategory_id) as unique_subcategories,
    AVG(ci.sustainability_score) as avg_sustainability_score,
    MAX(ci.last_worn_date) as last_activity_date,
    COUNT(CASE WHEN ci.last_worn_date > NOW() - INTERVAL '30 days' THEN 1 END) as items_worn_last_30_days
FROM public.user_profiles up
LEFT JOIN public.clothing_items ci ON up.user_id = ci.user_id
WHERE ci.deleted_at IS NULL
GROUP BY up.user_id;

-- Create unique index for concurrent refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_wardrobe_analytics_user_id 
ON public.user_wardrobe_analytics(user_id);

-- ============================================================================
-- 5. CREATE PERFORMANCE MONITORING FUNCTIONS
-- ============================================================================

-- Function to analyze RLS policy performance
CREATE OR REPLACE FUNCTION public.analyze_rls_performance()
RETURNS TABLE(
    table_name TEXT,
    policy_name TEXT,
    estimated_cost NUMERIC,
    recommendation TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.tablename::TEXT,
        p.policyname::TEXT,
        0::NUMERIC as estimated_cost,
        CASE 
            WHEN p.qual LIKE '%auth.uid()%' THEN 'Consider using (SELECT auth.uid()) for better performance'
            WHEN COUNT(*) OVER (PARTITION BY t.tablename, p.cmd) > 1 THEN 'Multiple permissive policies detected - consider consolidation'
            ELSE 'Policy looks optimized'
        END::TEXT as recommendation
    FROM pg_policies p
    JOIN pg_tables t ON p.tablename = t.tablename
    WHERE t.schemaname = 'public'
    AND p.permissive = 'PERMISSIVE';
END;
$$;

-- Function to refresh materialized views safely
CREATE OR REPLACE FUNCTION public.refresh_all_materialized_views()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    view_record RECORD;
    refresh_count INTEGER := 0;
BEGIN
    FOR view_record IN 
        SELECT schemaname, matviewname 
        FROM pg_matviews 
        WHERE schemaname = 'public'
    LOOP
        BEGIN
            EXECUTE format('REFRESH MATERIALIZED VIEW CONCURRENTLY %I.%I', 
                          view_record.schemaname, view_record.matviewname);
            refresh_count := refresh_count + 1;
        EXCEPTION
            WHEN OTHERS THEN
                -- Try non-concurrent refresh as fallback
                BEGIN
                    EXECUTE format('REFRESH MATERIALIZED VIEW %I.%I', 
                                  view_record.schemaname, view_record.matviewname);
                    refresh_count := refresh_count + 1;
                EXCEPTION
                    WHEN OTHERS THEN
                        RAISE LOG 'Failed to refresh materialized view %.%: %', 
                                 view_record.schemaname, view_record.matviewname, SQLERRM;
                END;
        END;
    END LOOP;
    
    RETURN refresh_count;
END;
$$;

-- ============================================================================
-- 6. CREATE CLEANUP AND MAINTENANCE FUNCTIONS
-- ============================================================================

-- Function to clean up old logs and temporary data
CREATE OR REPLACE FUNCTION public.cleanup_old_data(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    deleted_count INTEGER := 0;
    temp_count INTEGER;
BEGIN
    -- Clean up old error logs
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'error_logs') THEN
        DELETE FROM public.error_logs 
        WHERE created_at < NOW() - (days_to_keep || ' days')::INTERVAL;
        GET DIAGNOSTICS temp_count = ROW_COUNT;
        deleted_count := deleted_count + temp_count;
    END IF;
    
    -- Clean up old recommendation logs
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'recommendation_logs') THEN
        DELETE FROM public.recommendation_logs 
        WHERE created_at < NOW() - (days_to_keep || ' days')::INTERVAL;
        GET DIAGNOSTICS temp_count = ROW_COUNT;
        deleted_count := deleted_count + temp_count;
    END IF;
    
    -- Clean up old usage tracking data (keep aggregated monthly data)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'usage_tracking') THEN
        DELETE FROM public.usage_tracking 
        WHERE created_at < NOW() - (days_to_keep || ' days')::INTERVAL
        AND usage_date < DATE_TRUNC('month', CURRENT_DATE - INTERVAL '3 months');
        GET DIAGNOSTICS temp_count = ROW_COUNT;
        deleted_count := deleted_count + temp_count;
    END IF;
    
    RETURN deleted_count;
END;
$$;

-- ============================================================================
-- 7. CREATE TRIGGERS FOR NEW TABLES
-- ============================================================================

-- Update timestamp triggers for new tables
DO $$
DECLARE
    table_names TEXT[] := ARRAY[
        'outfit_recommendations', 'user_interactions', 'wardrobe_gaps',
        'outfit_collections', 'payments', 'referrals', 'user_credits',
        'event_templates', 'events', 'sustainability_tracking'
    ];
    tbl_name TEXT;
    trigger_name TEXT;
BEGIN
    FOREACH tbl_name IN ARRAY table_names
    LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = tbl_name) THEN
            trigger_name := 'update_' || tbl_name || '_updated_at';
            
            IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = trigger_name) THEN
                EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE ON public.%I 
                               FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
                              trigger_name, tbl_name);
            END IF;
        END IF;
    END LOOP;
END $$;

COMMIT;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION public.analyze_rls_performance() IS 'Analyzes RLS policies for performance issues';
COMMENT ON FUNCTION public.refresh_all_materialized_views() IS 'Safely refreshes all materialized views with fallback';
COMMENT ON FUNCTION public.cleanup_old_data(INTEGER) IS 'Cleans up old log data and temporary records';
COMMENT ON MATERIALIZED VIEW public.user_wardrobe_analytics IS 'Aggregated analytics for user wardrobes';