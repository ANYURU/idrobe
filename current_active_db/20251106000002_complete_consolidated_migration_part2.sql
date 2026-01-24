-- ============================================================================
-- COMPLETE CONSOLIDATED MIGRATION PART 2 - Indexes, Functions, RLS, Data
-- ============================================================================

BEGIN;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- User profiles indexes
CREATE INDEX idx_user_profiles_location ON public.user_profiles(location_country, location_city);
CREATE INDEX idx_user_profiles_body_type ON public.user_profiles(body_type);
CREATE INDEX idx_user_profiles_currency ON public.user_profiles(preferred_currency);
CREATE INDEX idx_user_profiles_billing ON public.user_profiles(billing_currency);
CREATE INDEX idx_user_profiles_plan ON public.user_profiles(current_plan_id);
CREATE INDEX idx_user_profiles_usage_reset ON public.user_profiles(usage_reset_date);

-- Clothing items indexes
CREATE INDEX idx_clothing_user_id ON public.clothing_items(user_id);
CREATE INDEX idx_clothing_category_id ON public.clothing_items(category_id);
CREATE INDEX idx_clothing_subcategory_id ON public.clothing_items(subcategory_id);
CREATE INDEX idx_clothing_season ON public.clothing_items USING GIN(season_ids);
CREATE INDEX idx_clothing_weather ON public.clothing_items USING GIN(weather_suitable);
CREATE INDEX idx_clothing_colors ON public.clothing_items(primary_color);
CREATE INDEX idx_clothing_archived ON public.clothing_items(user_id, is_archived);
CREATE INDEX idx_clothing_favorite ON public.clothing_items(user_id, is_favorite);
CREATE INDEX idx_clothing_last_worn ON public.clothing_items(last_worn_date DESC);
CREATE INDEX idx_clothing_currency ON public.clothing_items(currency);
CREATE INDEX idx_clothing_items_user_category ON public.clothing_items(user_id, category_id);
CREATE INDEX idx_clothing_items_user_active ON public.clothing_items(user_id, is_archived, deleted_at);

-- Vector similarity search
CREATE INDEX idx_clothing_embedding ON public.clothing_items USING ivfflat(embedding vector_cosine_ops) WITH (lists = 100);

-- Category system indexes
CREATE INDEX idx_categories_active ON public.clothing_categories(is_active);
CREATE INDEX idx_categories_parent ON public.clothing_categories(parent_category_id);
CREATE INDEX idx_categories_active_source ON public.clothing_categories(is_active, source);
CREATE INDEX idx_subcategories_category ON public.clothing_subcategories(category_id);
CREATE INDEX idx_subcategories_active ON public.clothing_subcategories(is_active);
CREATE INDEX idx_style_tags_trending ON public.style_tags(is_trending);
CREATE INDEX idx_style_tags_popularity ON public.style_tags(popularity_score DESC);
CREATE INDEX idx_style_tags_popularity_active ON public.style_tags(popularity_score DESC, is_active);

-- Junction table indexes
CREATE INDEX idx_style_tags_junction_item ON public.clothing_item_style_tags(clothing_item_id);
CREATE INDEX idx_style_tags_junction_tag ON public.clothing_item_style_tags(style_tag_id);

-- Outfit recommendations indexes
CREATE INDEX idx_recommendations_user_id ON public.outfit_recommendations(user_id);
CREATE INDEX idx_recommendations_occasion ON public.outfit_recommendations(occasion);
CREATE INDEX idx_recommendations_mood ON public.outfit_recommendations(mood);
CREATE INDEX idx_recommendations_weather ON public.outfit_recommendations(weather_condition);
CREATE INDEX idx_recommendations_generated_at ON public.outfit_recommendations(generated_at DESC);
CREATE INDEX idx_recommendations_score ON public.outfit_recommendations(ai_score DESC);
CREATE INDEX idx_recommendations_items ON public.outfit_recommendations USING GIN(clothing_item_ids);

-- User interactions indexes
CREATE INDEX idx_interactions_user_id ON public.user_interactions(user_id);
CREATE INDEX idx_interactions_recommendation_id ON public.user_interactions(recommendation_id);
CREATE INDEX idx_interactions_type ON public.user_interactions(interaction_type_name);
CREATE INDEX idx_interactions_date ON public.user_interactions(interacted_at DESC);

-- Wardrobe gaps indexes
CREATE INDEX idx_gaps_user_id ON public.wardrobe_gaps(user_id);
CREATE INDEX idx_gaps_priority ON public.wardrobe_gaps(priority DESC);
CREATE INDEX idx_gaps_addressed ON public.wardrobe_gaps(is_addressed);
CREATE INDEX idx_wardrobe_gaps_category_id ON public.wardrobe_gaps(category_id);

-- Outfit collections indexes
CREATE INDEX idx_collections_user_id ON public.outfit_collections(user_id);
CREATE INDEX idx_collections_favorite ON public.outfit_collections(user_id, is_favorite);
CREATE INDEX idx_collections_public ON public.outfit_collections(is_public);

-- Seasonal trends indexes
CREATE INDEX idx_trends_season_year ON public.seasonal_trends(season, year);
CREATE INDEX idx_trends_validity ON public.seasonal_trends(valid_from, valid_until);
CREATE INDEX idx_seasonal_trends_category_ids ON public.seasonal_trends USING GIN(trending_category_ids);
CREATE INDEX idx_seasonal_trend_categories_trend ON public.seasonal_trend_categories(trend_id);
CREATE INDEX idx_seasonal_trend_categories_category ON public.seasonal_trend_categories(category_id);

-- Duplicates indexes
CREATE INDEX idx_duplicates_user_id ON public.clothing_duplicates(user_id);
CREATE INDEX idx_duplicates_unresolved ON public.clothing_duplicates(user_id) WHERE user_confirmed IS NULL;

-- Recommendation logs indexes
CREATE INDEX idx_logs_user_id ON public.recommendation_logs(user_id);
CREATE INDEX idx_logs_input_context ON public.recommendation_logs USING GIN (input_context);

-- Error logs indexes
CREATE INDEX idx_error_logs_type_time ON public.error_logs(error_type, created_at);
CREATE INDEX idx_error_logs_user ON public.error_logs(user_id);

-- Category creation log indexes
CREATE INDEX idx_category_creation_log_user_time ON public.category_creation_log(user_id, created_at);

-- Waitlist archive indexes
CREATE INDEX idx_waitlist_archive_email ON public.waitlist_archive(email);
CREATE INDEX idx_waitlist_archive_migrated ON public.waitlist_archive(migrated_at);

-- Subscription system indexes
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_subscriptions_stripe_id ON public.subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_plan_id ON public.subscriptions(plan_id);
CREATE INDEX idx_plan_limits_plan_id ON public.plan_limits(plan_id);
CREATE INDEX idx_plan_limits_type ON public.plan_limits(limit_type);
CREATE INDEX idx_payments_user_id ON public.payments(user_id);
CREATE INDEX idx_payments_subscription_id ON public.payments(subscription_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_payments_external_transaction ON public.payments(stripe_payment_intent_id);
CREATE INDEX idx_referrals_referrer ON public.referrals(referrer_id);
CREATE INDEX idx_referrals_referee ON public.referrals(referee_id);
CREATE INDEX idx_referrals_code ON public.referrals(referral_code);
CREATE INDEX idx_referrals_source ON public.referrals(source);
CREATE INDEX idx_user_credits_user_id ON public.user_credits(user_id);
CREATE INDEX idx_user_credits_used ON public.user_credits(used_at);
CREATE INDEX idx_user_credits_used_for_payment_id ON public.user_credits(used_for_payment_id);
CREATE INDEX idx_usage_tracking_user_type ON public.usage_tracking(user_id, usage_type);
CREATE INDEX idx_usage_tracking_period ON public.usage_tracking(period_start, period_end);

-- Currency system indexes
CREATE INDEX idx_exchange_rates_currencies ON public.exchange_rates(base_currency, target_currency);
CREATE INDEX idx_exchange_rates_valid ON public.exchange_rates(valid_until) WHERE is_active = TRUE;
CREATE idx_exchange_rates_fetched ON public.exchange_rates(fetched_at DESC);
CREATE UNIQUE INDEX idx_exchange_rates_daily_unique ON public.exchange_rates(base_currency, target_currency, rate_date);

-- Event system indexes
CREATE INDEX idx_events_user_id ON public.events(user_id);
CREATE INDEX idx_sustainability_tracking_user_id ON public.sustainability_tracking(user_id);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Generic update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column() 
RETURNS TRIGGER 
SET search_path = ''
AS $$
BEGIN 
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Email check function
CREATE OR REPLACE FUNCTION public.check_email_exists(email_to_check TEXT)
RETURNS BOOLEAN
SET search_path = ''
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM auth.users 
        WHERE email = email_to_check AND deleted_at IS NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

-- Normalize enum value function
CREATE OR REPLACE FUNCTION public.normalize_enum_value(input_value TEXT)
RETURNS TEXT
SET search_path = ''
AS $$
BEGIN
    RETURN LOWER(TRIM(REPLACE(input_value, ' ', '-')));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Find or create season function
CREATE OR REPLACE FUNCTION public.find_or_create_season(season_name TEXT)
RETURNS UUID
SET search_path = ''
AS $$
DECLARE
    season_id UUID;
BEGIN
    SELECT id INTO season_id FROM public.seasons WHERE name = season_name;
    
    IF season_id IS NULL THEN
        INSERT INTO public.seasons (name) VALUES (season_name) RETURNING id INTO season_id;
    END IF;
    
    RETURN season_id;
END;
$$ LANGUAGE plpgsql;

-- Find or create fit preference function
CREATE OR REPLACE FUNCTION public.find_or_create_fit_preference(fit_name TEXT)
RETURNS UUID
SET search_path = ''
AS $$
DECLARE
    fit_id UUID;
BEGIN
    SELECT id INTO fit_id FROM public.fit_preferences WHERE name = fit_name;
    
    IF fit_id IS NULL THEN
        INSERT INTO public.fit_preferences (name) VALUES (fit_name) RETURNING id INTO fit_id;
    END IF;
    
    RETURN fit_id;
END;
$$ LANGUAGE plpgsql;

-- Calculate wardrobe diversity function
CREATE OR REPLACE FUNCTION public.calculate_wardrobe_diversity(target_user_id UUID)
RETURNS DECIMAL
SET search_path = ''
AS $$
DECLARE 
    diversity_score DECIMAL;
BEGIN
    SELECT
        (
            COUNT(DISTINCT category_id) * 10 + 
            COUNT(DISTINCT primary_color) * 5 + 
            COUNT(DISTINCT subcategory_id) * 3 + 
            CASE
                WHEN COUNT(DISTINCT season_ids) > 1 THEN 20
                ELSE 0
            END
        )::DECIMAL / 100.0 INTO diversity_score
    FROM public.clothing_items
    WHERE user_id = target_user_id
      AND is_archived = FALSE
      AND deleted_at IS NULL;

    RETURN LEAST(diversity_score, 1.0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Validate currency code function
CREATE OR REPLACE FUNCTION public.validate_currency_code(currency_code TEXT)
RETURNS BOOLEAN
SET search_path = ''
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.supported_currencies 
        WHERE code = currency_code AND is_active = true
    );
END;
$$ LANGUAGE plpgsql;

-- Currency validation trigger function
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

-- Find or create category function
CREATE OR REPLACE FUNCTION public.find_or_create_category(category_name TEXT)
RETURNS UUID
SET search_path = ''
AS $$
DECLARE
    category_id UUID;
    clean_name TEXT;
BEGIN
    IF category_name IS NULL OR trim(category_name) = '' THEN
        RAISE EXCEPTION 'Category name cannot be null or empty';
    END IF;
    
    IF length(trim(category_name)) > 100 THEN
        RAISE EXCEPTION 'Category name too long (max 100 characters)';
    END IF;
    
    clean_name := lower(trim(regexp_replace(category_name, '[^a-zA-Z0-9\\s\\-]', '', 'g')));
    
    SELECT id INTO category_id 
    FROM public.clothing_categories 
    WHERE lower(name) = clean_name AND is_active = TRUE;
    
    IF category_id IS NULL THEN
        INSERT INTO public.clothing_categories (name, is_active, source)
        VALUES (clean_name, FALSE, 'ai_suggested')
        RETURNING id INTO category_id;
    END IF;
    
    RETURN category_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Find or create subcategory function
CREATE OR REPLACE FUNCTION public.find_or_create_subcategory(subcategory_name TEXT, parent_category_id UUID)
RETURNS UUID
SET search_path = ''
AS $$
DECLARE
    subcategory_id UUID;
BEGIN
    SELECT id INTO subcategory_id 
    FROM public.clothing_subcategories 
    WHERE name = subcategory_name 
    AND category_id = parent_category_id 
    AND is_active = TRUE;
    
    IF subcategory_id IS NOT NULL THEN
        RETURN subcategory_id;
    END IF;
    
    INSERT INTO public.clothing_subcategories (name, category_id, is_active, source)
    VALUES (subcategory_name, parent_category_id, FALSE, 'ai_suggested')
    ON CONFLICT (name, category_id) DO UPDATE SET
        is_active = EXCLUDED.is_active,
        source = EXCLUDED.source
    RETURNING id INTO subcategory_id;
    
    RETURN subcategory_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get trending categories for season function
CREATE OR REPLACE FUNCTION public.get_trending_categories_for_season(target_season TEXT, target_year INTEGER)
RETURNS JSON
SET search_path = ''
AS $$
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
$$ LANGUAGE plpgsql;

-- Grant waitlist bonus function
CREATE OR REPLACE FUNCTION public.grant_waitlist_bonus(user_email TEXT, new_user_id UUID)
RETURNS BOOLEAN
SET search_path = ''
AS $$
DECLARE
    waitlist_record RECORD;
BEGIN
    SELECT * INTO waitlist_record 
    FROM public.waitlist_archive 
    WHERE email = user_email AND migrated_at IS NULL;
    
    IF FOUND THEN
        INSERT INTO public.user_credits (
            user_id,
            credit_type,
            amount,
            currency,
            description,
            expires_at
        ) VALUES (
            new_user_id,
            'bonus',
            10.00,
            'USD',
            'Waitlist early access bonus - auto-applies to next payment',
            NOW() + INTERVAL '6 months'
        );
        
        UPDATE public.waitlist_archive 
        SET migrated_at = NOW()
        WHERE id = waitlist_record.id;
        
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Currency conversion function
CREATE OR REPLACE FUNCTION convert_currency(
    amount DECIMAL(10,2),
    from_currency TEXT,
    to_currency TEXT
) RETURNS DECIMAL(10,2) 
SET search_path = ''
AS $$
DECLARE
    conversion_rate DECIMAL(12,6);
    converted_amount DECIMAL(10,2);
BEGIN
    IF from_currency = to_currency THEN
        RETURN amount;
    END IF;
    
    SELECT rate INTO conversion_rate
    FROM public.exchange_rates
    WHERE base_currency = from_currency 
    AND target_currency = to_currency
    AND valid_until > NOW()
    AND is_active = TRUE
    ORDER BY fetched_at DESC
    LIMIT 1;
    
    IF conversion_rate IS NULL THEN
        RETURN amount;
    END IF;
    
    converted_amount := amount * conversion_rate;
    
    RETURN ROUND(converted_amount, 2);
END;
$$ LANGUAGE plpgsql STABLE;

-- Levenshtein function wrapper
CREATE OR REPLACE FUNCTION public.levenshtein(text, text)
RETURNS integer AS $$
BEGIN
    RETURN extensions.levenshtein($1, $2);
END;
$$ LANGUAGE plpgsql IMMUTABLE STRICT SECURITY DEFINER SET search_path = 'public, extensions';

-- Cleanup orphaned records function
CREATE OR REPLACE FUNCTION cleanup_orphaned_records()
RETURNS INTEGER 
SET search_path = ''
AS $$
DECLARE
    deleted_count INTEGER := 0;
    temp_count INTEGER;
BEGIN
    DELETE FROM public.clothing_item_style_tags cist
    WHERE NOT EXISTS (
        SELECT 1 FROM public.clothing_items ci 
        WHERE ci.id = cist.clothing_item_id
    );
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    DELETE FROM public.seasonal_trend_categories stc
    WHERE NOT EXISTS (
        SELECT 1 FROM public.seasonal_trends st 
        WHERE st.id = stc.trend_id
    );
    
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_count := deleted_count + temp_count;
    
    INSERT INTO public.error_logs (error_type, error_message, context)
    VALUES ('INFO', 'Cleanup completed', '{"orphaned_records_removed": ' || deleted_count || '}');
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;