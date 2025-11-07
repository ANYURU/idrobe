-- ============================================================================
-- ADD ADVANCED FEATURES - Missing Tables and Functions from Current DB
-- Adds the sophisticated features present in the current database
-- ============================================================================
BEGIN;

-- ============================================================================
-- 1. ADVANCED TRACKING TABLES
-- ============================================================================
-- User credits system
CREATE TABLE IF NOT EXISTS public.user_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    credit_type TEXT NOT NULL CHECK (
        credit_type IN ('referral', 'promo', 'refund', 'bonus')
    ),
    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    source_id UUID,
    description TEXT,
    expires_at TIMESTAMPTZ,
    used_at TIMESTAMPTZ,
    used_for_payment_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments tracking
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID,
    user_id UUID NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT NOT NULL,
    status TEXT NOT NULL CHECK (
        status IN ('pending', 'succeeded', 'failed', 'refunded')
    ),
    payment_type TEXT NOT NULL DEFAULT 'subscription' CHECK (
        payment_type IN ('subscription', 'credit', 'refund')
    ),
    stripe_payment_intent_id TEXT,
    stripe_invoice_id TEXT,
    paid_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    failure_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Referral system
CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL,
    referee_id UUID NOT NULL,
    referral_code TEXT NOT NULL UNIQUE,
    reward_type TEXT NOT NULL DEFAULT 'credit' CHECK (reward_type IN ('credit', 'cash', 'discount')),
    reward_value DECIMAL(10, 2) NOT NULL,
    reward_currency TEXT NOT NULL DEFAULT 'USD',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (
        status IN ('pending', 'completed', 'paid', 'expired')
    ),
    completed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    source TEXT DEFAULT 'manual',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage tracking
CREATE TABLE IF NOT EXISTS public.usage_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    usage_type TEXT NOT NULL,
    usage_count INTEGER DEFAULT 1,
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. WARDROBE ANALYSIS TABLES
-- ============================================================================
-- Wardrobe gaps analysis
CREATE TABLE IF NOT EXISTS public.wardrobe_gaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    gap_type TEXT NOT NULL,
    category_id UUID REFERENCES public.clothing_categories(id),
    subcategory_id UUID REFERENCES public.clothing_subcategories(id),
    description TEXT NOT NULL,
    priority INTEGER DEFAULT 5 CHECK (
        priority >= 1
        AND priority <= 10
    ),
    suggested_items JSONB DEFAULT '[]',
    estimated_cost DECIMAL(10, 2),
    currency TEXT DEFAULT 'USD',
    is_addressed BOOLEAN DEFAULT FALSE,
    addressed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Outfit collections
CREATE TABLE IF NOT EXISTS public.outfit_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    clothing_item_ids UUID [] NOT NULL,
    is_favorite BOOLEAN DEFAULT FALSE,
    times_worn INTEGER DEFAULT 0,
    last_worn_date DATE,
    is_public BOOLEAN DEFAULT FALSE,
    share_count INTEGER DEFAULT 0,
    estimated_cost DECIMAL(10, 2),
    currency TEXT DEFAULT 'USD',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clothing duplicates detection
CREATE TABLE IF NOT EXISTS public.clothing_duplicates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    original_item_id UUID NOT NULL,
    duplicate_item_id UUID NOT NULL,
    similarity_score DECIMAL(3, 2) NOT NULL CHECK (
        similarity_score >= 0
        AND similarity_score <= 1
    ),
    detection_method TEXT DEFAULT 'embedding-similarity',
    user_confirmed BOOLEAN,
    resolved_at TIMESTAMPTZ,
    detected_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(original_item_id, duplicate_item_id)
);

-- ============================================================================
-- 3. SEASONAL AND TREND ANALYSIS
-- ============================================================================
-- Seasonal trends
CREATE TABLE IF NOT EXISTS public.seasonal_trends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    season_name TEXT NOT NULL,
    year INTEGER NOT NULL,
    trending_colors TEXT [],
    trending_patterns TEXT [],
    trending_styles TEXT [],
    trending_category_ids UUID [],
    trend_description TEXT,
    source TEXT,
    confidence_score DECIMAL(3, 2),
    region TEXT,
    valid_from DATE NOT NULL,
    valid_until DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(season_name, year, region)
);

-- Junction table for seasonal trends categories
CREATE TABLE IF NOT EXISTS public.seasonal_trend_categories (
    trend_id UUID REFERENCES public.seasonal_trends(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.clothing_categories(id) ON DELETE CASCADE,
    PRIMARY KEY (trend_id, category_id)
);

-- ============================================================================
-- 4. RECOMMENDATION AND INTERACTION TRACKING
-- ============================================================================
-- User interactions (if not exists)
CREATE TABLE IF NOT EXISTS public.user_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    recommendation_id UUID,
    clothing_item_id UUID,
    interaction_type_name TEXT NOT NULL,
    feedback_text TEXT,
    rating INTEGER CHECK (
        rating >= 1
        AND rating <= 5
    ),
    interacted_at TIMESTAMPTZ DEFAULT NOW(),
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

-- Recommendation logs
CREATE TABLE IF NOT EXISTS public.recommendation_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    recommendation_id UUID,
    input_context JSONB NOT NULL,
    output_items UUID [],
    ai_confidence DECIMAL(3, 2) CHECK (
        ai_confidence >= 0
        AND ai_confidence <= 1
    ),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 5. EVENT SYSTEM
-- ============================================================================
-- Event templates
CREATE TABLE IF NOT EXISTS public.event_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    occasion_name TEXT NOT NULL,
    default_duration_hours INTEGER,
    style_preferences TEXT [],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Events
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    occasion_name TEXT NOT NULL,
    event_date TIMESTAMPTZ NOT NULL,
    duration_hours INTEGER,
    location TEXT,
    weather_forecast JSONB,
    outfit_selected_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Event outfit choices
CREATE TABLE IF NOT EXISTS public.event_outfit_choices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    outfit_items UUID [] NOT NULL,
    user_rating INTEGER CHECK (
        user_rating >= 1
        AND user_rating <= 5
    ),
    is_selected BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 6. SUSTAINABILITY TRACKING
-- ============================================================================
-- Sustainability tracking
CREATE TABLE IF NOT EXISTS public.sustainability_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    item_id UUID,
    action_type TEXT NOT NULL,
    impact_score DECIMAL(5, 2),
    carbon_footprint_kg DECIMAL(8, 3),
    water_usage_liters DECIMAL(10, 2),
    waste_reduction_kg DECIMAL(8, 3),
    action_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 7. ADVANCED FUNCTIONS
-- ============================================================================
-- Calculate wardrobe diversity
CREATE
OR REPLACE FUNCTION public.calculate_wardrobe_diversity(target_user_id UUID) RETURNS DECIMAL
SET
    search_path = '' AS $$ DECLARE diversity_score DECIMAL;

BEGIN
SELECT
    (
        COUNT(DISTINCT category_id) * 10 + COUNT(DISTINCT primary_color) * 5 + COUNT(DISTINCT subcategory_id) * 3 + CASE
            WHEN array_length(array_agg(DISTINCT season_name), 1) > 1 THEN 20
            ELSE 0
        END
    ) :: DECIMAL / 100.0 INTO diversity_score
FROM
    public.clothing_items,
    LATERAL unnest(season_names) AS season_name
WHERE
    user_id = target_user_id
    AND is_archived = FALSE
    AND deleted_at IS NULL;

RETURN LEAST(diversity_score, 1.0);

END;

$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Currency conversion function
CREATE
OR REPLACE FUNCTION convert_currency(
    amount DECIMAL(10, 2),
    from_currency TEXT,
    to_currency TEXT
) RETURNS DECIMAL(10, 2)
SET
    search_path = '' AS $$ DECLARE conversion_rate DECIMAL(12, 6);

converted_amount DECIMAL(10, 2);

BEGIN IF from_currency = to_currency THEN RETURN amount;

END IF;

SELECT
    rate INTO conversion_rate
FROM
    public.exchange_rates
WHERE
    base_currency = from_currency
    AND target_currency = to_currency
    AND valid_until > NOW()
    AND is_active = TRUE
ORDER BY
    fetched_at DESC
LIMIT
    1;

IF conversion_rate IS NULL THEN RETURN amount;

END IF;

converted_amount := amount * conversion_rate;

RETURN ROUND(converted_amount, 2);

END;

$$ LANGUAGE plpgsql STABLE;

-- Get trending categories for season
CREATE
OR REPLACE FUNCTION public.get_trending_categories_for_season(target_season TEXT, target_year INTEGER) RETURNS JSON
SET
    search_path = '' AS $$ BEGIN RETURN (
        SELECT
            json_agg(
                json_build_object(
                    'id',
                    cc.id,
                    'name',
                    cc.name,
                    'trend_description',
                    st.trend_description
                )
            )
        FROM
            public.seasonal_trends st
            JOIN public.seasonal_trend_categories stc ON st.id = stc.trend_id
            JOIN public.clothing_categories cc ON stc.category_id = cc.id
        WHERE
            st.season_name = target_season
            AND st.year = target_year
            AND CURRENT_DATE BETWEEN st.valid_from
            AND st.valid_until
    );

END;

$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant waitlist bonus function
CREATE
OR REPLACE FUNCTION public.grant_waitlist_bonus(user_email TEXT, new_user_id UUID) RETURNS BOOLEAN
SET
    search_path = '' AS $$ DECLARE waitlist_record RECORD;

BEGIN -- Check if waitlist_archive table exists
IF NOT EXISTS (
    SELECT
        1
    FROM
        information_schema.tables
    WHERE
        table_name = 'waitlist_archive'
) THEN RETURN FALSE;

END IF;

SELECT
    * INTO waitlist_record
FROM
    public.waitlist_archive
WHERE
    email = user_email
    AND migrated_at IS NULL;

IF FOUND THEN
INSERT INTO
    public.user_credits (
        user_id,
        credit_type,
        amount,
        currency,
        description,
        expires_at
    )
VALUES
    (
        new_user_id,
        'bonus',
        10.00,
        'USD',
        'Waitlist early access bonus - auto-applies to next payment',
        NOW() + INTERVAL '6 months'
    );

UPDATE
    public.waitlist_archive
SET
    migrated_at = NOW()
WHERE
    id = waitlist_record.id;

RETURN TRUE;

END IF;

RETURN FALSE;

END;

$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 8. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================
-- User credits indexes
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON public.user_credits(user_id);

CREATE INDEX IF NOT EXISTS idx_user_credits_used ON public.user_credits(used_at);

-- Payments indexes
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);

CREATE INDEX IF NOT EXISTS idx_payments_subscription_id ON public.payments(subscription_id);

CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

-- Referrals indexes
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals(referrer_id);

CREATE INDEX IF NOT EXISTS idx_referrals_referee ON public.referrals(referee_id);

CREATE INDEX IF NOT EXISTS idx_referrals_code ON public.referrals(referral_code);

-- Usage tracking indexes
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_type ON public.usage_tracking(user_id, usage_type);

CREATE INDEX IF NOT EXISTS idx_usage_tracking_period ON public.usage_tracking(period_start, period_end);

-- Wardrobe gaps indexes
CREATE INDEX IF NOT EXISTS idx_gaps_user_id ON public.wardrobe_gaps(user_id);

CREATE INDEX IF NOT EXISTS idx_gaps_priority ON public.wardrobe_gaps(priority DESC);

CREATE INDEX IF NOT EXISTS idx_gaps_addressed ON public.wardrobe_gaps(is_addressed);

-- Outfit collections indexes
CREATE INDEX IF NOT EXISTS idx_collections_user_id ON public.outfit_collections(user_id);

CREATE INDEX IF NOT EXISTS idx_collections_favorite ON public.outfit_collections(user_id, is_favorite);

CREATE INDEX IF NOT EXISTS idx_collections_public ON public.outfit_collections(is_public);

-- Duplicates indexes
CREATE INDEX IF NOT EXISTS idx_duplicates_user_id ON public.clothing_duplicates(user_id);

CREATE INDEX IF NOT EXISTS idx_duplicates_unresolved ON public.clothing_duplicates(user_id)
WHERE
    user_confirmed IS NULL;

-- Seasonal trends indexes
CREATE INDEX IF NOT EXISTS idx_trends_season_year ON public.seasonal_trends(season_name, year);

CREATE INDEX IF NOT EXISTS idx_trends_validity ON public.seasonal_trends(valid_from, valid_until);

CREATE INDEX IF NOT EXISTS idx_seasonal_trends_category_ids ON public.seasonal_trends USING GIN(trending_category_ids);

-- User interactions indexes
CREATE INDEX IF NOT EXISTS idx_interactions_user_id ON public.user_interactions(user_id);

CREATE INDEX IF NOT EXISTS idx_interactions_type ON public.user_interactions(interaction_type_name);

CREATE INDEX IF NOT EXISTS idx_interactions_date ON public.user_interactions(interacted_at DESC);

-- Recommendation logs indexes
CREATE INDEX IF NOT EXISTS idx_logs_user_id ON public.recommendation_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_logs_input_context ON public.recommendation_logs USING GIN (input_context);

-- Event system indexes
CREATE INDEX IF NOT EXISTS idx_events_user_id ON public.events(user_id);

CREATE INDEX IF NOT EXISTS idx_event_templates_user_id ON public.event_templates(user_id);

CREATE INDEX IF NOT EXISTS idx_sustainability_tracking_user_id ON public.sustainability_tracking(user_id);

-- ============================================================================
-- 9. ENABLE ROW LEVEL SECURITY
-- ============================================================================
-- Enable RLS on all new user-specific tables
ALTER TABLE
    public.user_credits ENABLE ROW LEVEL SECURITY;

ALTER TABLE
    public.payments ENABLE ROW LEVEL SECURITY;

ALTER TABLE
    public.referrals ENABLE ROW LEVEL SECURITY;

ALTER TABLE
    public.usage_tracking ENABLE ROW LEVEL SECURITY;

ALTER TABLE
    public.wardrobe_gaps ENABLE ROW LEVEL SECURITY;

ALTER TABLE
    public.outfit_collections ENABLE ROW LEVEL SECURITY;

ALTER TABLE
    public.clothing_duplicates ENABLE ROW LEVEL SECURITY;

ALTER TABLE
    public.user_interactions ENABLE ROW LEVEL SECURITY;

ALTER TABLE
    public.recommendation_logs ENABLE ROW LEVEL SECURITY;

ALTER TABLE
    public.event_templates ENABLE ROW LEVEL SECURITY;

ALTER TABLE
    public.events ENABLE ROW LEVEL SECURITY;

ALTER TABLE
    public.event_outfit_choices ENABLE ROW LEVEL SECURITY;

ALTER TABLE
    public.sustainability_tracking ENABLE ROW LEVEL SECURITY;

-- Enable RLS on reference tables
ALTER TABLE
    public.seasonal_trends ENABLE ROW LEVEL SECURITY;

ALTER TABLE
    public.seasonal_trend_categories ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 10. CREATE RLS POLICIES
-- ============================================================================
-- User Credits Policies
DO $$ BEGIN IF NOT EXISTS (
    SELECT
        1
    FROM
        pg_policies
    WHERE
        tablename = 'user_credits'
        AND policyname = 'Users can view own credits'
) THEN CREATE POLICY "Users can view own credits" ON public.user_credits FOR
SELECT
    USING (
        (
            select
                auth.uid()
        ) = user_id
    );

END IF;

END $$;

-- Payments Policies
DO $$ BEGIN IF NOT EXISTS (
    SELECT
        1
    FROM
        pg_policies
    WHERE
        tablename = 'payments'
        AND policyname = 'Users can view own payments'
) THEN CREATE POLICY "Users can view own payments" ON public.payments FOR
SELECT
    USING (
        (
            select
                auth.uid()
        ) = user_id
    );

END IF;

END $$;

-- Wardrobe Gaps Policies
DO $$ BEGIN IF NOT EXISTS (
    SELECT
        1
    FROM
        pg_policies
    WHERE
        tablename = 'wardrobe_gaps'
        AND policyname = 'Users can manage own wardrobe gaps'
) THEN CREATE POLICY "Users can manage own wardrobe gaps" ON public.wardrobe_gaps FOR ALL USING (
    (
        select
            auth.uid()
    ) = user_id
);

END IF;

END $$;

-- Outfit Collections Policies
DO $$ BEGIN IF NOT EXISTS (
    SELECT
        1
    FROM
        pg_policies
    WHERE
        tablename = 'outfit_collections'
        AND policyname = 'Users can manage own collections'
) THEN CREATE POLICY "Users can manage own collections" ON public.outfit_collections FOR ALL USING (
    (
        select
            auth.uid()
    ) = user_id
);

END IF;

END $$;

-- User Interactions Policies
DO $$ BEGIN IF NOT EXISTS (
    SELECT
        1
    FROM
        pg_policies
    WHERE
        tablename = 'user_interactions'
        AND policyname = 'Users can manage own interactions'
) THEN CREATE POLICY "Users can manage own interactions" ON public.user_interactions FOR ALL USING (
    (
        select
            auth.uid()
    ) = user_id
);

END IF;

END $$;

-- Event System Policies
DO $$ BEGIN IF NOT EXISTS (
    SELECT
        1
    FROM
        pg_policies
    WHERE
        tablename = 'events'
        AND policyname = 'Users can manage own events'
) THEN CREATE POLICY "Users can manage own events" ON public.events FOR ALL USING (
    (
        select
            auth.uid()
    ) = user_id
);

END IF;

IF NOT EXISTS (
    SELECT
        1
    FROM
        pg_policies
    WHERE
        tablename = 'event_templates'
        AND policyname = 'Users can manage own event templates'
) THEN CREATE POLICY "Users can manage own event templates" ON public.event_templates FOR ALL USING (
    (
        select
            auth.uid()
    ) = user_id
);

END IF;

END $$;

-- Reference Tables Policies (Public Read Access)
DO $$ BEGIN IF NOT EXISTS (
    SELECT
        1
    FROM
        pg_policies
    WHERE
        tablename = 'seasonal_trends'
        AND policyname = 'Anyone can view seasonal trends'
) THEN CREATE POLICY "Anyone can view seasonal trends" ON public.seasonal_trends FOR
SELECT
    USING (true);

END IF;

IF NOT EXISTS (
    SELECT
        1
    FROM
        pg_policies
    WHERE
        tablename = 'seasonal_trend_categories'
        AND policyname = 'Anyone can view trend categories'
) THEN CREATE POLICY "Anyone can view trend categories" ON public.seasonal_trend_categories FOR
SELECT
    USING (true);

END IF;

END $$;

-- ============================================================================
-- 11. CREATE UPDATE TRIGGERS
-- ============================================================================
-- Update timestamp triggers for new tables
DO $$ BEGIN IF NOT EXISTS (
    SELECT
        1
    FROM
        pg_trigger
    WHERE
        tgname = 'update_wardrobe_gaps_updated_at'
) THEN CREATE TRIGGER update_wardrobe_gaps_updated_at BEFORE
UPDATE
    ON public.wardrobe_gaps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

END IF;

IF NOT EXISTS (
    SELECT
        1
    FROM
        pg_trigger
    WHERE
        tgname = 'update_outfit_collections_updated_at'
) THEN CREATE TRIGGER update_outfit_collections_updated_at BEFORE
UPDATE
    ON public.outfit_collections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

END IF;

IF NOT EXISTS (
    SELECT
        1
    FROM
        pg_trigger
    WHERE
        tgname = 'update_subscription_plans_updated_at'
) THEN CREATE TRIGGER update_subscription_plans_updated_at BEFORE
UPDATE
    ON public.subscription_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

END IF;

IF NOT EXISTS (
    SELECT
        1
    FROM
        pg_trigger
    WHERE
        tgname = 'update_subscriptions_updated_at'
) THEN CREATE TRIGGER update_subscriptions_updated_at BEFORE
UPDATE
    ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

END IF;

END $$;

COMMIT;

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE public.user_credits IS 'User credit system for referrals and bonuses';

COMMENT ON TABLE public.payments IS 'Payment tracking for subscriptions and credits';

COMMENT ON TABLE public.referrals IS 'Referral system for user acquisition';

COMMENT ON TABLE public.usage_tracking IS 'Track user usage against plan limits';

COMMENT ON TABLE public.wardrobe_gaps IS 'AI-identified gaps in user wardrobes';

COMMENT ON TABLE public.outfit_collections IS 'User-curated outfit combinations';

COMMENT ON TABLE public.clothing_duplicates IS 'AI-detected duplicate clothing items';

COMMENT ON TABLE public.seasonal_trends IS 'Fashion trends by season and region';

COMMENT ON TABLE public.user_interactions IS 'User feedback on recommendations and items';

COMMENT ON TABLE public.recommendation_logs IS 'Logs of AI recommendation runs';

COMMENT ON TABLE public.events IS 'User events requiring outfit planning';

COMMENT ON TABLE public.sustainability_tracking IS 'Environmental impact tracking';

COMMENT ON FUNCTION public.calculate_wardrobe_diversity(UUID) IS 'Calculates diversity score for user wardrobe';

COMMENT ON FUNCTION convert_currency(DECIMAL, TEXT, TEXT) IS 'Converts amounts between supported currencies';

COMMENT ON FUNCTION public.get_trending_categories_for_season(TEXT, INTEGER) IS 'Returns trending categories for a specific season';

COMMENT ON FUNCTION public.grant_waitlist_bonus(TEXT, UUID) IS 'Grants bonus credits to waitlist users';